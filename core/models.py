from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

from bill_splitter.settings import AUTH_USER_MODEL

      
class UserManager(BaseUserManager):
    """Custom user manager to handle user creation and superuser creation."""

    def create_user(self, email, display_name, password=None):
        """Create and save a user with the given email, display name, and
        password."""
        if not email:
            raise ValueError('Users must have an email address')
        if not display_name:
            raise ValueError('Users must have a display name')

        user = self.model(
            email=self.normalize_email(email),
            display_name=display_name,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, display_name, password):
        """Create and save a superuser with the given email, display name,
        and password."""
        user = self.create_user(email, display_name, password)
        user.is_admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """Custom user model that extends the default Django user model.
    Includes additional fields for display name, profile picture."""

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    profile_picture = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']

    objects = UserManager()

    def __str__(self):
        return f"[USER] {self.display_name} ({self.email})"

    def get_full_name(self):
        """Return the display name as the full name of the user."""
        return self.display_name

    def get_short_name(self):
        """Return the display name as the short name of the user."""
        return self.display_name
      
      
class HouseholdManager(models.Manager):
    """helper methods for managing household instances go here"""

    def create_household(self, household_name, created_by):
        household = self.create(name=household_name)
        household.members.add(created_by) # add creator as a member
        return household

      
class Household(models.Model):
    """name: name for the household.
    members: set of users who belong to the household"""
    objects = HouseholdManager()

    name = models.CharField(max_length=200)
    members = models.ManyToManyField(
        AUTH_USER_MODEL,
        related_name='households',
        blank=True)

    def __str__(self):
        return self.name

    def add_member(self, user):
        self.members.add(user)

    def remove_member(self, user):
        self.members.remove(user)
        if self.members.count()==0:
            self.delete()

    def get_members(self):
        return self.members.all()

    def get_summary(self, current_user):
        """Return a dict keyed by user id for each household member other than
        current_user. Each value contains the member's display_name, how much
        they owe current_user, and how much current_user owes them"""
        summary = {}
        for member in self.members.exclude(pk=current_user.pk):
            they_owe_me = Debt.objects.filter(
                bill__household=self,
                bill__user_owed=current_user,
                user_owing=member,
                is_resolved=False
            ).aggregate(total=models.Sum('amount'))['total'] or 0

            i_owe_them = Debt.objects.filter(
                bill__household=self,
                bill__user_owed=member,
                user_owing=current_user,
                is_resolved=False
            ).aggregate(total=models.Sum('amount'))['total'] or 0

            summary[member.pk] = {
                'display_name': member.display_name,
                'they_owe_me': they_owe_me,
                'i_owe_them': i_owe_them,
            }
        return summary


class BillManager(models.Manager):
    """Custom manager for the Bill model to handle bill creation."""

    def create_bill(self, name, household, amount, user_owed, debts):
        """Create and save a bill with the given name, user owed,
        and debts."""
        bill = self.model(
            name=name,
            household=household,
            amount=amount,
            user_owed=user_owed,
        )
        bill.save(using=self._db)

        for user_id, amount in debts.items():
            user = User.objects.get(pk=user_id)
            debt = Debt.objects.create_debt(amount, user, bill)
            bill.debts.add(debt)
        
        return bill


class Bill(models.Model):
    """Model representing a bill, which includes a name, date created, user
    owed, and associated debts."""

    name = models.CharField(max_length=255)
    household = models.ForeignKey(
        'Household',
        related_name='bills',
        on_delete=models.CASCADE,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_created = models.DateTimeField(auto_now_add=True)
    user_owed = models.ForeignKey(
        User,
        related_name='bills',
        on_delete=models.CASCADE,
    )
    resolved = models.BooleanField(default=False)

    objects = BillManager()

    def __str__(self):
        return (
            f"[BILL] {self.name} - {self.amount} "
            f"for {self.household.name} "
            f"owed to {self.user_owed.display_name}"
        )
    
    def update(self, name=None, user_owed=None, debts=None):
        """Update this bill's resolved flag."""
        self.resolved = all(debt.is_resolved for debt in self.debts.all())
        self.save()


class DebtManager(models.Manager):
    """Custom manager for the Debt model to handle debt creation."""

    def create_debt(self, amount, user_owing, bill):
        """Create and save a debt with the given amount, user owing, and
        associated bill."""
        debt = self.model(
            amount=amount,
            user_owing=user_owing,
            bill=bill
        )
        debt.save(using=self._db)
        return debt


class Debt(models.Model):
    """Model representing a debt, which includes an amount, user owing, and
    associated bill."""

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    user_owing = models.ForeignKey(
        User,
        related_name='debts',
        on_delete=models.CASCADE,
    )
    bill = models.ForeignKey(
        Bill,
        related_name='debts',
        on_delete=models.CASCADE,
    )
    is_resolved = models.BooleanField(default=False)

    objects = DebtManager()

    def __str__(self):
        return (
            f"[DEBT] {self.user_owing.display_name} "
            f"owes {self.amount} "
            f"to {self.bill.user_owed.display_name} "
            f"for {self.bill.name}"
        )

    def update(self, payment_amount):
        """Update this debt's resolved flag based on payment_amount."""
        if payment_amount >= self.amount:
            self.is_resolved = True
        self.save()


class PaymentManager(models.Manager):
    """Custom manager for the Payment model to handle payment creation."""

    def create_payment(self, amount, user_paying, debt):
        """Create and save a payment with the given amount, user paying, and
        associated debt."""
        payment = self.model(
            amount=amount,
            user_paying=user_paying,
            debt=debt
        )
        payment.save(using=self._db)
        payment.debt.update(payment.amount)
        return payment


class Payment(models.Model):
    """Model representing a payment, which includes an amount, user paying, date,
    and associated debt."""

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    user_paying = models.ForeignKey(
        User,
        related_name='payments',
        on_delete=models.CASCADE,
    )
    date = models.DateTimeField(auto_now_add=True)
    debt = models.ForeignKey(
        Debt,
        related_name='payments',
        on_delete=models.CASCADE,
    )

    objects = PaymentManager()

    def __str__(self):
        return (
            f"[PAYMENT] {self.user_paying.display_name} "
            f"paid {self.amount} "
            f"to {self.debt.bill.user_owed.display_name} "
            f"for {self.debt.bill.name}"
        )

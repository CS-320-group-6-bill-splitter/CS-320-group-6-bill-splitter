from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

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
        return self.display_name

    def get_full_name(self):
        """Return the display name as the full name of the user."""
        return self.display_name

    def get_short_name(self):
        """Return the display name as the short name of the user."""
        return self.display_name


class BillManager(models.Manager):
    """Custom manager for the Bill model to handle bill creation."""

    def create_bill(self, name, household, date_created, user_owed, debts):
        """Create and save a bill with the given name, date created, user owed,
        and debts."""
        bill = self.model(
            name=name,
            household=household,
            date_created=date_created,
            user_owed=user_owed
        )
        for debt in debts:
            bill.debts.add(debt) // TODO: fix once Debt model is implemented
        bill.save(using=self._db)
        return bill


class Bill(models.Model):
    """Model representing a bill, which includes a name, date created, user
    owed, and associated debts."""

    name = models.CharField(max_length=255)
    household = models.ForeignKey('Household', on_delete=models.CASCADE)
    date_created = models.DateTimeField(auto_now_add=True)
    user_owed = models.ForeignKey(User, on_delete=models.CASCADE)
    resolved = models.BooleanField(default=False)

    objects = BillManager()

    def __str__(self):
        return f"{self.name} owed to {self.user_owed.display_name}"

    def get_total_amount(self):
        """Calculate and return the total amount owed for this bill."""
        total = 0
        for debt in self.debts.all(): // TODO: fix once Debt model is implemented
            total += debt.amount
        return total
    
    def update(self, name=None, user_owed=None, debts=None):
        """Update this bill's resolved flag."""
        self.resolved = all(debt.is_resolved for debt in self.debts.all()) // TODO: fix once Debt model is implemented
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
    user_owing = models.ForeignKey(User, on_delete=models.CASCADE)
    bill = models.ForeignKey(Bill, related_name='debts', on_delete=models.CASCADE)
    is_resolved = models.BooleanField(default=False)

    objects = DebtManager()

    def __str__(self):
        return f"{self.user_owing.display_name} owes {self.amount} for {self.bill.name}"

    def update(self, payment_amount):
        """Update this debt's resolved flag based on the payment_amount amount."""
        if payment_amount >= self.amount:
            self.is_resolved = True
        self.save()


class PaymentManager(models.Manager):
    """Custom manager for the Payment model to handle payment creation."""

    def create_payment(self, amount, user_paying, date, debt):
        """Create and save a payment with the given amount, user paying, and
        associated debt."""
        payment = self.model(
            amount=amount,
            user_paying=user_paying,
            date=date,
            debt=debt
        )
        payment.save(using=self._db)
        payment.debt.update(payment.amount)
        return payment


class Payment(models.Model):
    """Model representing a payment, which includes an amount, user paying, date,
    and associated debt."""

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    user_paying = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    debt = models.ForeignKey(Debt, related_name='payments', on_delete=models.CASCADE)

    objects = PaymentManager()

    def __str__(self):
        return f"{self.user_paying.display_name} paid {self.amount} for {self.debt.bill.name}"
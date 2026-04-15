from django.core.management.base import BaseCommand
from core.models import User, Household, Bill, Debt, Payment

class Command(BaseCommand):
    """Django management command to seed the database with initial data for
    testing."""

    def handle(self, *args, **options):
        """Seed the database with initial data."""
        response = input(
            "This will delete all existing data and create new test data. "
            "Do you want to continue? [y/N]: "
        )
        if response.lower() != 'y':
            self.stdout.write(
                self.style.WARNING("Operation cancelled. No data was modified.")
            )
            return

        # Clear existing data
        Payment.objects.all().delete()
        Debt.objects.all().delete()
        Bill.objects.all().delete()
        Household.objects.all().delete()
        User.objects.all().delete()

        # Create users
        artichoke = User.objects.create_user(
            display_name='artichoke',
            email='artichoke@example.com',
            password='password'
        )
        bart = User.objects.create_user(
            display_name='bart',
            email='bart@example.com',
            password='password'
        )
        chad = User.objects.create_user(
            display_name='chad',
            email='chad@example.com',
            password='password'
        )
        green = User.objects.create_user(
            display_name='green',
            email='green@example.com',
            password='password'
        )

        # create households
        household1 = Household.objects.create_household(household_name='123 Main St', created_by=artichoke)
        household1.add_member(bart)
        household1.add_member(chad)
        household2 = Household.objects.create_household(household_name='456 Elm St', created_by=artichoke)
        household2.add_member(green)

        # create bills and debts for household 1
        bill1 = Bill.objects.create_bill(
            name='Electricity Bill',
            household=household1,
            amount=150,
            user_owed=artichoke,
            debts={
                bart.id: 50,
                chad.id: 50,
            }
        )
        bill2 = Bill.objects.create_bill(
            name='Groceries',
            household=household1,
            amount=100,
            user_owed=bart,
            debts={
                artichoke.id: 50,
                chad.id: 30,
            }
        )

        # create bills and debts for household 2
        bill3 = Bill.objects.create_bill(
            name='Internet Bill',
            household=household2,
            amount=80,
            user_owed=green,
            debts={
                artichoke.id: 40,
            }
        )

        # create payments
        payment1 = Payment.objects.create_payment(
            debt=bill1.debts.get(user_owing=bart),
            user_paying=bart,
            amount=50
        )
        payment2 = Payment.objects.create_payment(
            debt=bill2.debts.get(user_owing=artichoke),
            user_paying=artichoke,
            amount=20
        )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully."))

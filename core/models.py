from django.db import models

from bill_splitter import settings


# Create your models here.
class HouseholdManager(models.Manager):
    """helper methods for managing household instances go here"""

    def create_household(self, household_name, created_by):
        household = self.create(name=household_name)
        household.members.add(created_by) # add creator as a member
        return household

class Household():
    """name: name for the household.
    members: set of users who belong to the household"""
    objects = HouseholdManager()

    name = models.CharField(max_length=200)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='households',
        blank=True)

    def __str__(self):
        return self.name

    def add_member(self, user):
        self.members.add(user)

    def remove_member(self, user):
        self.members.remove(user)

    def get_members(self):
        return self.members.all()

    def get_summary(self):
        # to be added once bill/debts models are complete
        return self.members.all()
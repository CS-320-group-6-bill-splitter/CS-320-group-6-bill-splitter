from rest_framework import serializers
from .models import Household


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""

    class Meta:
        model = User
        fields = ['id', 'display_name', 'email']


class HouseholdSerializer(serializers.ModelSerializer):
    """Serializer for the Household model."""

    members = serializers.StringRelatedField(many=True, read_only=True)
    #total bills active for user
    #total amount user owes for household
    member_count = serializers.IntegerField(
        source='members.count',
        read_only=True,
    )

    class Meta:
        model = Household
        fields = ['id', 'name', 'members', 'member_count']


class BillListSerializer(serializers.ModelSerializer):
    """Serializer for the Bill model. For use in returning lists of bills."""
    
    users_owing = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id',
            'name',
            'amount',
            'date_created',
            'users_owing',
        ]

    def get_users_owing(self, bill):
        """Return a list of users who owe money for this bill."""
        users = [debt.user_owing for debt in bill.debts.all()]
        return UserSerializer(users, many=True).data
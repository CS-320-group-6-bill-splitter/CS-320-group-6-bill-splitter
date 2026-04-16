from rest_framework import serializers
from .models import Bill, Household, HouseholdInvitation, User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""

    class Meta:
        model = User
        fields = ['id', 'display_name', 'email']


class HouseholdInvitationSerializer(serializers.ModelSerializer):
    """Serializer for HouseholdInvitation, including household info for
    display in the invitee's household list."""

    household_id = serializers.IntegerField(source='household.id', read_only=True)
    household_name = serializers.CharField(source='household.name', read_only=True)

    class Meta:
        model = HouseholdInvitation
        fields = ['token', 'household_id', 'household_name', 'email', 'status', 'created_at']
        read_only_fields = ['token', 'status', 'created_at']


class HouseholdSerializer(serializers.ModelSerializer):
    """Serializer for the Household model."""

    members = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(
        source='members.count',
        read_only=True,
    )
    pending_invitations = serializers.SerializerMethodField()

    class Meta:
        model = Household
        fields = ['id', 'name', 'members', 'member_count', 'pending_invitations']

    def get_members(self, household):
        """Return id and display_name for each household member."""
        return [
            {'id': user.id, 'display_name': user.display_name}
            for user in household.members.all()
        ]

    def get_pending_invitations(self, household):
        """Return emails of users with pending invitations to this household."""
        pending = household.invitations.filter(status=HouseholdInvitation.PENDING)
        return [{'email': inv.email, 'created_at': inv.created_at} for inv in pending]


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
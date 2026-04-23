from rest_framework import serializers

from .models import Bill, Household, HouseholdInvitation, User, Debt, Payment


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
    debts = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id',
            'name',
            'amount',
            'date_created',
            'users_owing',
            'debts',
        ]

    def get_users_owing(self, bill):
        """Return a list of users who owe money for this bill."""
        users = [debt.user_owing for debt in bill.debts.all()]
        return UserSerializer(users, many=True).data

    def get_debts(self, bill):
        """Return per-debtor breakdown including amount owed and amount paid."""
        result = []
        for debt in bill.debts.all():
            paid = sum(debt.payments.values_list('amount', flat=True))
            result.append({
                'id': debt.id,
                'amount': str(debt.amount),
                'paid_amount': str(paid),
                'is_resolved': debt.is_resolved,
                'user': {
                    'id': debt.user_owing.id,
                    'display_name': debt.user_owing.display_name,
                    'email': debt.user_owing.email,
                },
            })
        return result


class BillDetailSerializer(serializers.ModelSerializer):
    """Serializer for the Bill model. For use in returning details of a bill."""
    
    #debts = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id',
            'name',
            'amount',
            'date_created',
            'debts',
        ]

    def get_debts(self, bill):
        """Return a list of debts for this bill."""
        debts = bill.debts.all()
        return DebtSerializer(debts, many=True).data
    

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for the Payment model."""

    date_created = serializers.SerializerMethodField()
    user_from = serializers.SerializerMethodField()
    user_to = serializers.SerializerMethodField()
    bill_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'amount',
            'date_created',
            'user_from',
            'user_to',
            'bill_name',
        ]

    def get_date_created(self, payment):
        """Return the date the payment was created."""
        return payment.date.isoformat()

    def get_bill_name(self, payment):
        """Return the name of the bill associated with this payment."""
        return payment.debt.bill.name

    def get_user_from(self, payment):
        """Return the display name of the user making the payment."""
        return payment.user_paying.display_name

    def get_user_to(self, payment):
        """Return the display name of the user receiving the payment."""
        return payment.debt.bill.user_owed.display_name

class DebtSerializer(serializers.ModelSerializer):
    """Serializer for the Debt model."""

    user_owing = UserSerializer(read_only=True)
    user_owed = UserSerializer(source='bill.user_owed', read_only=True)
    bill_name = serializers.CharField(source='bill.name', read_only=True)
    is_resolved = serializers.BooleanField(read_only=True)
    paid_amount = serializers.SerializerMethodField()

    class Meta:
        model = Debt
        fields = [
            'id',
            'amount',
            'paid_amount',
            'is_resolved',
            'user_owing',
            'user_owed',
            'bill',
            'bill_name',
        ]

    def get_paid_amount(self, debt):
        """Sum of all payments made toward this debt."""
        total = sum(debt.payments.values_list('amount', flat=True))
        return str(total)

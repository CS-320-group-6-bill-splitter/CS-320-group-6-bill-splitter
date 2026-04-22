import json

from django.contrib.auth import authenticate, login, logout
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bill, Debt, Household, HouseholdInvitation, Payment, User
from .serializers import BillListSerializer, HouseholdInvitationSerializer, HouseholdSerializer, UserSerializer, PaymentSerializer, BillDetailSerializer, DebtSerializer


@csrf_exempt
@require_POST
def register(request):
    """Register a new user with the provided email, display name, and
    password."""
    data = json.loads(request.body)
    email = data.get('email')
    display_name = data.get('display_name')
    password = data.get('password')

    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'A user with this email already exists'}, status=400)

    user = User.objects.create_user(email=email, display_name=display_name, password=password)
    login(request, user)
    return JsonResponse({'message': 'User created successfully',
                         'display_name': user.display_name}, status=201)


@csrf_exempt
@require_POST
def login_view(request):
    """Authenticate and log in a user with the provided email and password."""
    data = json.loads(request.body)
    email = data.get('email')
    password = data.get('password')

    user = authenticate(request, email=email, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)

    login(request, user)
    return JsonResponse({'message': 'Login successful', 'display_name': user.display_name, 'profile_picture': user.profile_picture,})


@csrf_exempt
@login_required
@require_POST
def logout_view(request):
    """Log out the currently authenticated user."""
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


def me_view(request):
    """Return the currently authenticated user, or 401."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return JsonResponse({
        'id': request.user.id,
        'email': request.user.email,
        'display_name': request.user.display_name,
        'profile_picture': request.user.profile_picture,
    })


class HouseholdListCreateView(APIView):
    """View for listing and creating households."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all households the user is a member of, plus pending invitations."""
        households = request.user.households.all()
        pending_invitations = HouseholdInvitation.objects.filter(
            email=request.user.email,
            status=HouseholdInvitation.PENDING,
        )
        return Response({
            'memberships': HouseholdSerializer(households, many=True).data,
            'invitations': HouseholdInvitationSerializer(pending_invitations, many=True).data,
        })

    def post(self, request):
        """Create a new household"""
        serializer = HouseholdSerializer(data=request.data)
        if serializer.is_valid():
            household = Household.objects.create_household(
                household_name=serializer.validated_data['name'],
                created_by=request.user
            )

            return Response(
                HouseholdSerializer(household).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HouseholdDetailView(APIView):
    """
    GET: retrieve a household
    PATCH: update a household's name
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Household, pk=pk, members=user)

    def get(self, request, pk):
        household = self.get_object(pk, request.user)
        serializer = HouseholdSerializer(household)
        return Response(serializer.data)

    def patch(self, request, pk):
        household = self.get_object(pk, request.user)
        serializer = HouseholdSerializer(household, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HouseholdSummaryView(APIView):
    """ GET return household summary for the authenticated user (see Household.get_summary) """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        household = get_object_or_404(Household, pk=pk, members=request.user)
        summary = household.get_summary(request.user)
        return Response(summary)


class HouseholdLeaveView(APIView):
    """
    POST: remove the requesting user from the household.
    Deletes the household if they were the last member.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        household = get_object_or_404(Household, pk=pk, members=request.user)
        household.remove_member(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
      

class HouseholdInviteView(APIView):
    """
    POST: invite a user by email to the household.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        household = get_object_or_404(Household, pk=pk, members=request.user)
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        if household.members.filter(email=email).exists():
            return Response(
                {'error': 'A user with this email is already a member of this household'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if HouseholdInvitation.objects.filter(
            household=household,
            email=email,
            status=HouseholdInvitation.PENDING,
        ).exists():
            return Response(
                {'error': 'A pending invitation has already been sent to this email'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = HouseholdInvitation.objects.create_invitation(
            household=household,
            email=email,
        )

        from django.conf import settings
        accept_url = f"{getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')}/invitations/{invitation.token}/respond"

        send_mail(
            subject=f"You've been invited to join {household.name} on SplitSeas!",
            message=(
                f"Hi!\n\n"
                f"{request.user.display_name} has invited you to join "
                f"\"{household.name}\" on SplitSeas.\n\n"
                f"You can accept your invitation here:\n{accept_url}\n\n"
            ),
            from_email=None,
            recipient_list=[email],
            fail_silently=True,
        )

        return Response(
            HouseholdInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )


class InvitationRespondView(APIView):
    """
    POST: accept or decline a pending invitation.
    The authenticated user's email must match the invitation email.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        invitation = get_object_or_404(
            HouseholdInvitation,
            token=token,
            email=request.user.email,
            status=HouseholdInvitation.PENDING,
        )
        action = request.data.get('action')
        if action == 'accept':
            invitation.accept(request.user)
            return Response({'message': 'Invitation accepted'})
        elif action == 'decline':
            invitation.decline()
            return Response({'message': 'Invitation declined'})
        else:
            return Response(
                {'error': 'Invalid action. Use "accept" or "decline".'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class BillListView(APIView):
    """View for listing bills in a household."""

    permission_classes = [IsAuthenticated]

    def get(self, request, household_id):
        """List all bills a user is owed for in a household."""
        household = get_object_or_404(Household, id=household_id)
        if request.user not in household.members.all():
            return Response(
                {'error': 'You are not a member of this household'},
                status=status.HTTP_403_FORBIDDEN,
            )
        bills = Bill.objects.filter((Q(user_owed=request.user) | Q(debts__user_owing=request.user)), household=household).distinct()
        
        serializer = BillListSerializer(bills, many=True)

        return Response(serializer.data)


class BillCreateView(APIView):
    """View for creating a new bill in a household."""

    permission_classes = [IsAuthenticated]

    def post(self, request, household_id):
        """Create a new bill in a household."""
        household = get_object_or_404(Household, id=household_id)
        if request.user not in household.members.all():
            return Response(
                {'error': 'You are not a member of this household'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BillListSerializer(data=request.data)
        if serializer.is_valid():
            bill = Bill.objects.create_bill(
                name=serializer.validated_data['name'],
                household=household,
                amount=serializer.validated_data['amount'],
                user_owed=request.user,
                debts=serializer.validated_data['debts'],
            )

            return Response(
                BillListSerializer(bill).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BillDetailView(APIView):
    """
    GET    /households/<household_id>/bills/<bill_id>/  → retrieve a bill
    PATCH  /households/<household_id>/bills/<bill_id>/  → update a bill's name, amount, or debts
    DELETE /households/<household_id>/bills/<bill_id>/  → delete a bill
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, household_id, bill_id):
        """Retrieve a bill."""
        household = get_object_or_404(Household, id=household_id)
        if request.user not in household.members.all():
            return Response(
                {'error': 'You are not a member of this household'},
                status=status.HTTP_403_FORBIDDEN,
            )

        bill = get_object_or_404(Bill, id=bill_id, household=household)
        serializer = BillDetailSerializer(bill)

        return Response(serializer.data)

    def patch(self, request, household_id, bill_id):
        """Update a bill's name."""
        household = get_object_or_404(Household, id=household_id)
        if request.user not in household.members.all():
            return Response(
                {'error': 'You are not a member of this household'},
                status=status.HTTP_403_FORBIDDEN,
            )

        bill = get_object_or_404(Bill, id=bill_id, household=household)
        serializer = BillListSerializer(bill, data={ 'name': request.data.get('name') }, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, household_id, bill_id):
        """Delete a bill."""
        household = get_object_or_404(Household, id=household_id)
        if request.user not in household.members.all():
            return Response(
                {'error': 'You are not a member of this household'},
                status=status.HTTP_403_FORBIDDEN,
            )

        bill = get_object_or_404(Bill, id=bill_id, household=household)

        if bill.user_owed != request.user:
            return Response(
                {'error': 'Only the user owed can delete this bill'},
                status=status.HTTP_403_FORBIDDEN,
            )

        bill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

      
class DebtListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, household_id):
        household = get_object_or_404(Household, id=household_id)

        if request.user not in household.members.all():
            return Response({'error': 'Forbidden'}, status=403)

        debts = Debt.objects.filter(
            bill__household=household,
            user_owing=request.user
        ).distinct()

        status_filter = request.query_params.get("status")

        if status_filter == "paid":
            debts = debts.filter(is_resolved=True)

        elif status_filter == "unpaid":
            debts = debts.filter(is_resolved=False)

        return Response(DebtSerializer(debts, many=True).data)

class DebtDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, household_id, debt_id):
        household = get_object_or_404(Household, id=household_id)

        if request.user not in household.members.all():
            return Response({'error': 'Forbidden'}, status=403)

        debt = get_object_or_404(
            Debt,
            id=debt_id,
            bill__household=household,
            user_owing=request.user
        )

        return Response(DebtSerializer(debt).data)

class DebtPayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, household_id, debt_id):
        household = get_object_or_404(Household, id=household_id)

        if request.user not in household.members.all():
            return Response({'error': 'Forbidden'}, status=403)

        debt = get_object_or_404(
            Debt,
            id=debt_id,
            bill__household=household,
            user_owing=request.user
        )

        try:
            amount = float(request.data.get("amount"))
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=400)

        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)

        if amount > debt.amount:
            return Response({'error': 'Cannot pay more than debt amount'}, status=400)

        payment = Payment.objects.create_payment(
            amount=amount,
            user_paying=request.user,
            debt=debt
        )

        total_paid = sum(debt.payments.values_list("amount", flat=True))

        if total_paid >= float(debt.amount):
            debt.is_resolved = True
            debt.save()

        return Response(PaymentSerializer(payment).data, status=201)

class DebtFilterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, household_id):
        household = get_object_or_404(Household, id=household_id)

        if request.user not in household.members.all():
            return Response({'error': 'Forbidden'}, status=403)

        debts = Debt.objects.filter(
            bill__household=household,
            user_owing=request.user
        ).distinct()

        status_filter = request.query_params.get("status")

        if status_filter == "paid":
            debts = debts.filter(is_resloved=True)

        elif status_filter == "unpaid":
            debts = debts.filter(is_resolved=False)

        return Response(DebtSerializer(debts, many=True).data)
      

class PaymentListByBillView(APIView):
    """View for listing payments for a specific bill."""

    permission_classes = [IsAuthenticated]

    def get(self, request, bill_id):
        """List all payments for the specified bill."""
        bill = get_object_or_404(Bill, id=bill_id)
        if request.user != bill.user_owed:
            return Response(
                {'error': 'Only the user owed can view payments for this bill'},
                status=status.HTTP_403_FORBIDDEN,
            )
        payments = Payment.objects.filter(debt__bill=bill)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
    

class PaymentListByDebtView(APIView):
    """View for listing payments for a specific debt."""

    permission_classes = [IsAuthenticated]

    def get(self, request, debt_id):
        """List all payments for the specified debt."""
        debt = get_object_or_404(Debt, id=debt_id)
        if request.user != debt.user_owing:
            return Response(
                {'error': 'Only the user owing can view payments for this debt'},
                status=status.HTTP_403_FORBIDDEN,
            )
        payments = Payment.objects.filter(debt=debt)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

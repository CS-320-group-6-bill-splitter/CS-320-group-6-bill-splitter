import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bill, Debt, Household, HouseholdInvitation, Payment, User
from .serializers import BillListSerializer, HouseholdInvitationSerializer, HouseholdSerializer, UserSerializer


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


@login_required
@require_POST
def logout_view(request):
    """Log out the currently authenticated user."""
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})


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
    GET    /households/<id>/      → retrieve a household
    PATCH  /households/<id>/      → update a household's name
    # DELETE removed — households are deleted automatically when all members leave
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
    POST /households/<id>/leave/  → remove the requesting user from the household.
                                    Deletes the household if they were the last member.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        household = get_object_or_404(Household, pk=pk, members=request.user)
        household.remove_member(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

class HouseholdInviteView(APIView):
    """
    POST /households/<id>/invite/  → invite a user by email to the household.
                                     Only existing members may send invitations.
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
        return Response(
            HouseholdInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )


class InvitationRespondView(APIView):
    """
    POST /invitations/<token>/respond/  → accept or decline a pending invitation.
                                          The authenticated user's email must match
                                          the invitation email.
    Body: {"action": "accept" | "decline"}
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

        bills = request.user.bills_owed.filter(household=household)
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
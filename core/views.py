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

from .models import Bill, Debt, Household, Payment, User 
from .serializers import BillListSerializer, HouseholdSerializer, UserSerializer


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
        """List all existing households"""
        households = request.user.households.all()
        serializer = HouseholdSerializer(households, many=True)
        return Response(serializer.data)

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
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from .models import User, Household
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .serializers import HouseholdSerializer

# endpoints

# if not logged in, serve the login page

@require_POST
def register(request):
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
    logout(request)
    return JsonResponse({'message': 'Logged out successfully'})

# update user: display name, add/change profile image

# if logged in, serve the home page (list of households)

# dashboard for specific household
    # list of amounts owed by users
    # list of bills for household

class HouseholdListCreateView(APIView):
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
            return Response(HouseholdSerializer(household).data, status=status.HTTP_201_CREATED)
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

# add user to household

# create bill form

# view bill details

# view amount details for specific user

# user settings

# make payment form

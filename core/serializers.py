from rest_framework import serializers
from .models import Household

class HouseholdSerializer(serializers.ModelSerializer):
    members = serializers.StringRelatedField(many=True, read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    #total bills active for user
    #total amount user owes for household
    class Meta:
        model = Household
        fields = ['id', 'name', 'members', 'member_count']
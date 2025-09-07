from rest_framework import serializers
from .models import GroceryRequest

class GroceryRequestSerializer(serializers.ModelSerializer):
    class Meta():
        model = GroceryRequest
        fields = ['id', 'keywords', 'meals', 'servings_per_meal', 'ai_response', 'created_at']
        read_only_fields = ['id', 'ai_response', 'created_at']
       
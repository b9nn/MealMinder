from django.contrib import admin

# Register your models here.

from .models import GroceryRequest
@admin.register(GroceryRequest)
class GroceryRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "keywords", "meals", "servings_per_meal", "created_at")
    ordering = ["-created_at"]

from django.urls import path
from .views import GroceryRequestView, GroceryRequestListView, GroceryRequestDetailView

urlpatterns = [
    # path("route/", view, name="optional_name")
    path('generate/', GroceryRequestView.as_view(), name="generate"),
    path('history/', GroceryRequestListView.as_view(), name='grocery-history'),
    path('history/<int:pk>/', GroceryRequestDetailView.as_view(), name='grocery-detail'),
]
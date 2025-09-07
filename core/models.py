from django.db import models

class GroceryRequest(models.Model):
    keywords = models.JSONField() # list of keywords
    meals = models.IntegerField()
    servings_per_meal = models.IntegerField(default=1)
    ai_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GroceryRequest(meals={self.meals}, keywords={self.keywords})"
    
    


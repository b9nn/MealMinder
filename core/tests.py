from django.test import TestCase
from rest_framework.test import APIClient

class GroceryRequestTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_generate_request(self):
        payload = {
            "keywords": "tofu, mushrooms, rice",
            "meals": 2,
            "servings_per_meal": 3
        }
        response = self.client.post("/api/generate/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("ai_response", response.data)

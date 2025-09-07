from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics


from .serializers import GroceryRequestSerializer
from .models import GroceryRequest
import openai
import json

# all past requests
class GroceryRequestListView(generics.ListAPIView):
    queryset = GroceryRequest.objects.all().order_by('-created_at')
    serializer_class = GroceryRequestSerializer

# one past request
class GroceryRequestDetailView(generics.RetrieveAPIView):
    queryset = GroceryRequest.objects.all()
    serializer_class = GroceryRequestSerializer

@method_decorator(csrf_exempt, name='dispatch')
class GroceryRequestView(APIView):
    def post(self, request):
        serializer = GroceryRequestSerializer(data=request.data)
        if serializer.is_valid():
            grocery_request = serializer.save() # save req
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) #init openai client

            # prompt
            prompt = f"""
            Generate a grocery list and meal ideas for these keywords: 
            {grocery_request.keywords}.
            Number of meals: {grocery_request.meals}.
            For each meal make sure that the ingredients are sclaed so each meal serves {grocery_request.servings_per_meal}
            Please return results in a clear JSON format with fields 'meals' and 'grocery_list'.
            """

            try:
                response = client.chat.completions.create(
                    model = "gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful grocery planning assistant."},
                        {"role": "user", "content": prompt},
                    ],
                    response_format= {"type": "json_object"}
                )
                ai_output_raw = response.choices[0].message.content

                try:
                    ai_output = json.loads(ai_output_raw)
                except json.JSONDecodeError:
                    ai_output = {"error": "AI returned invalid JSON"}

                grocery_request.ai_response = ai_output
                grocery_request.save()

                return Response({
                    "id": grocery_request.id,
                    "keywords": grocery_request.keywords,
                    "meals": grocery_request.meals,
                    "servings_per_meal": grocery_request.servings_per_meal,
                    "ai_response": ai_output,
                }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
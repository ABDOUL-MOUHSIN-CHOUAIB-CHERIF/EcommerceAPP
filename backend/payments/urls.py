# backend/payments/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('initiate-mobile/', views.initiate_mobile_payment, name='initiate_mobile'),
    path('status/<str:reference>/', views.check_payment_status, name='payment_status'),
]
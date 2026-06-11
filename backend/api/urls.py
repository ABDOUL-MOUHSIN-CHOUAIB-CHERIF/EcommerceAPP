from django import views
from django.urls import path
from .views import ProductListCreateView ,ProductDetailView,CartView,CartItemDetailView,ProfileView ,CheckoutView , create_order,OrderHistoryView ,OrderDetailView, RegisterView
from .views import EmailTokenObtainPairView, test_campay_connection

urlpatterns = [
    path('products/', ProductListCreateView.as_view()),
    path('products/<int:pk>/', ProductDetailView.as_view()),
    path('cart/<int:user_id>/', CartView.as_view()),
    path('token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('cart/item/<int:pk>/', CartItemDetailView.as_view()),
    path('checkout/<int:user_id>/', CheckoutView.as_view()),
    path('orders/<int:user_id>/', OrderHistoryView.as_view()),
    path('order/<int:pk>/', OrderDetailView.as_view()),
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('register/', RegisterView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('test-campay/', test_campay_connection, name='test_campay'),
    path('orders/create/', create_order, name='create_order')
]
from rest_framework.views import APIView, csrf_exempt
from rest_framework.response import Response
from rest_framework import status
from urllib3 import request
from .models import Product ,Cart, CartItem , Order, OrderItem
from .serializers import ProductSerializer, CartSerializer, CartItemSerializer, OrderSerializer ,RegisterSerializer ,UserProfileSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer
from django.views.decorators.http import require_http_methods
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Order, OrderItem  


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class ProductListCreateView(APIView):

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer( products, many=True, context={'request': request}  )
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailView(APIView):

    def get(self, request, pk):
        import traceback
        try:
            print(f"=== Getting product with PK: {pk} ===")
            product = get_object_or_404(Product, pk=pk)
            print(f"Product found: {product.name}")
            print(f"Product image: {product.image}")
            
            serializer = ProductSerializer(product, context={'request': request})
            print("Serializer created successfully")
            
            return Response(serializer.data)
            
        except Exception as e:
            print("=" * 50)
            print("ERROR OCCURRED:")
            print(str(e))
            print(traceback.format_exc())
            print("=" * 50)
            return Response(
                {'error': str(e), 'traceback': traceback.format_exc()}, 
                status=500
            )

    def put(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductSerializer(product, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        cart = get_object_or_404(Cart, user_id=user_id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request, user_id):
        cart, created = Cart.objects.get_or_create(user_id=user_id)

        product_id = request.data.get('product')
        quantity = request.data.get('quantity', 1)

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id
        )

        if not item_created:
            cart_item.quantity += int(quantity)
        else:
            cart_item.quantity = quantity

        cart_item.save()

        return Response({"message": "Item added to cart"})

class CartItemDetailView(APIView):

    def put(self, request, pk):
        cart_item = get_object_or_404(CartItem, pk=pk)

        quantity = request.data.get('quantity')

        if quantity is None:
            return Response(
                {"error": "Quantity is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = int(quantity)
        cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)

    def delete(self, request, pk):
        cart_item = get_object_or_404(CartItem, pk=pk)
        cart_item.delete()

        return Response(
            {"message": "Item removed from cart"},
            status=status.HTTP_204_NO_CONTENT
        )


class CheckoutView(APIView):

    def post(self, request, user_id):
        cart = get_object_or_404(Cart, user_id=user_id)
        cart_items = CartItem.objects.filter(cart=cart)

        if not cart_items.exists():
            return Response(
                {"error": "Cart is empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_price = 0

        for item in cart_items:
            total_price += item.product.price * item.quantity

        order = Order.objects.create(
            user_id=user_id,
            total_price=total_price
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        cart_items.delete()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OrderHistoryView(APIView):

    def get(self, request, user_id):
        orders = Order.objects.filter(user_id=user_id)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

class OrderDetailView(APIView):

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # from rest_framework.permissions import IsAuthenticated


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
@csrf_exempt
@require_http_methods(["GET"])
def test_campay_connection(request):
            """Test if CamPay keys are working"""
            try:
                service = CamPayService()
                token = service.get_access_token()
                
                return JsonResponse({
                    'success': True,
                    'message': 'CamPay connection successful!',
                    'token_preview': token[:20] + '...' if token else 'None'
                })
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': str(e)
                }, status=500)
            


@csrf_exempt
@require_http_methods(["POST"])
def create_order(request):
    """Create a new order"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Get user ID from token if not authenticated
        if not user.is_authenticated:
            # Get user from Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                # You'll need to decode token to get user
                # For now, use a default or get from data
                user_id = data.get('user_id')
                from django.contrib.auth.models import User
                user = User.objects.get(id=user_id)
        
        # Create order
        order = Order.objects.create(
            user=user,
            full_name=data['shipping']['fullName'],
            phone_number=data['shipping']['phoneNumber'],
            delivery_address=data['shipping']['deliveryAddress'],
            city=data['shipping']['city'],
            postal_code=data['shipping'].get('postalCode', ''),
            delivery_method=data['delivery_method'],
            payment_method=data['payment_method'],
            subtotal=data['subtotal'],
            delivery_price=data['delivery_price'],
            total_amount=data['total_amount'],
            status='pending'
        )
        
        # Create order items
        for item in data['items']:
            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                quantity=item['quantity'],
                price=item['price']
            )
        
        return JsonResponse({
            'success': True,
            'id': order.id,
            'reference': f"ORD-{order.id}",
            'message': 'Order created successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
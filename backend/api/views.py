from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from urllib3 import request
from .models import Product ,Cart, CartItem , Order, OrderItem
from .serializers import ProductSerializer, CartSerializer, CartItemSerializer, OrderSerializer ,RegisterSerializer ,UserProfileSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer


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
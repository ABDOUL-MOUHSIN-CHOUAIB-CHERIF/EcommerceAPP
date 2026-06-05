import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Orders } from './pages/orders/orders';
import { Profile } from './pages/profile/profile';
import { Products } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { authGuard } from './core/guards/auth-guard';
import { TestPayment } from './pages/test-payment/test-payment';

export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full' },
    {path: 'home' , component: Home},
    {path: 'register', component: Register},
    {path: 'login', component: Login},
    { path: 'test-payment', component: TestPayment },
    {path: 'dashboard', component: Dashboard , canActivate: [authGuard]},
    {path: 'cart' , component: Cart , canActivate: [authGuard]},
    {path: 'checkout', component: Checkout, canActivate: [authGuard]},
    {path: 'orders', component: Orders ,canActivate: [authGuard]},
    {path: 'profile', component: Profile ,canActivate: [authGuard]},
    {path: 'products', component: Products ,canActivate: [authGuard]},
    {path: 'product-detail/:id', component: ProductDetail ,canActivate: [authGuard]}

];

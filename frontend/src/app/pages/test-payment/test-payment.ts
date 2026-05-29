// test-payment.ts - Using standard checkout (no key needed)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 50px; text-align: center;">
      <h1>Test Flutterwave Payment</h1>
      <button (click)="testPayment()" style="padding: 15px 30px; font-size: 18px;">
        Pay 1000 CFA (Test)
      </button>
      <p style="margin-top: 20px;" *ngIf="message">{{ message }}</p>
    </div>
  `
})
export class TestPayment {
  message = '';

  testPayment() {
    this.message = 'Opening Flutterwave...';
    
    // Create a script element
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => {
      // @ts-ignore
      FlutterwaveCheckout({
        public_key: 'FLWPUBK_TEST-816b7a96-17ca-46ad-a443-0cdaf06bb7fb', // Your key with prefix
        tx_ref: 'test_' + Date.now(),
        amount: 1000,
        currency: 'XAF',
        payment_options: 'card',
        customer: {
          email: 'test@example.com',
          phonenumber: '699999999',
          name: 'Test User'
        },
        customizations: {
          title: 'Test Payment',
          description: 'Testing Flutterwave',
          logo: 'https://flutterwave.com/images/logo-colored.svg'
        },
        callback: (response: any) => {
          console.log('Payment successful:', response);
          this.message = 'Payment successful!';
        },
        onclose: () => {
          console.log('Modal closed');
          this.message = 'Modal closed';
        }
      });
    };
    document.body.appendChild(script);
  }
}
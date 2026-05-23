import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Footer } from '../../shared/footer/footer';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule ,Footer
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
}) 
export class Login {

  formData = {
    email: '',
    password: ''
  };

  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {

    this.loading = true;

    console.log('LOGIN DATA:', this.formData);

    this.auth.login(this.formData).subscribe({

      next: (res) => {

        console.log('LOGIN RESPONSE:', res);

        // Save token
        this.auth.saveToken(res.access);

        console.log('Token saved');

        // Navigate
        this.router.navigateByUrl('/dashboard');

      },

      error: (err) => {

        console.error('LOGIN ERROR:', err);

        this.loading = false;

        alert('Invalid credentials');

      }

    });

  }

}
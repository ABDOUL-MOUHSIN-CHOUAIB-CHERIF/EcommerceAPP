import { Component } from '@angular/core';
import { Footer } from '../../shared/footer/footer';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [Footer, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {

    //  Validate passwords
    if (this.formData.password !== this.formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const data = {
      username: this.formData.username,
      email: this.formData.email,
      password: this.formData.password
    };

    console.log('FORM DATA:', this.formData);
    this.auth.register(data).subscribe({
      next: () => {
        alert('Registration successful');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        alert('Registration failed');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
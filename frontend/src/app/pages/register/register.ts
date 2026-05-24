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

  // Add this method to handle responsive adjustments
ngAfterViewInit() {
    this.adjustForMobile();
    window.addEventListener('resize', () => this.adjustForMobile());
}

adjustForMobile() {
    const registerDiv = document.querySelector('.register');
    if (window.innerWidth <= 768) {
        registerDiv?.classList.add('mobile-view');
    } else {
        registerDiv?.classList.remove('mobile-view');
    }
}

// Don't forget to implement the goToLogin method if not exists
goToLogin() {
    this.router.navigate(['/login']);
}
}
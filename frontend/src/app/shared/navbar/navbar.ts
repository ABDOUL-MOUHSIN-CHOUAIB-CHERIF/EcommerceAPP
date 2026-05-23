import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar  implements OnInit{
 
    menuOpen = false;
 
  user: any;

  constructor(private auth: AuthService,private router : Router) {}

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (res) => {
        console.log('PROFILE:', res);
        this.user = res;
      },
      error: () => {
        console.log('Not logged in');
      }
    });
  }
     gotToRegister(){
            this.router.navigate(['/register'])
        }
       goToLogin(){
            this.router.navigate(['/login'])
        }
        goToProduct() {
          this.router.navigate(['/product']);
        }
        goToHome() {
          this.router.navigate(['/dashboard']);
        }
        goToCart() {
          this.router.navigate(['/cart']);
        }



         // Hamburger methods
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMenu() {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }
}




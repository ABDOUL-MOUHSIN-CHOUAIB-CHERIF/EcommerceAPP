import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-home',
  imports: [ Navbar],
  templateUrl: './home.html',
  styleUrl: './home.css',
}) 
export class Home {
    constructor(private router:Router){}

     gotToRegister(){
            this.router.navigate(['/register'])
        }
       goToLogin(){
            this.router.navigate(['/login'])
        }
        goToDashboard(){
            this.router.navigate(['/products'])
        }
        
        
}

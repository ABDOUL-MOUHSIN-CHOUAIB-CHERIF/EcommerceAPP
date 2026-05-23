// profile.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
  imports : [CommonModule, Navbar]
})
export class Profile {

  notifications = {
    orders:     true,
    newsletter: false,
    restock:    true
  };

  recentOrders = [
    {
      ref:    '#EV-92841',
      name:   'Luxury Leather Tote',
      date:   'Jan 12, 2024',
      amount: 45000,
      status: 'Shipped',
      image:  'assets/images/tote.jpg'
    },
    {
      ref:    '#EV-91204',
      name:   'Everest Chronograph',
      date:   'Jan 05, 2024',
      amount: 82500,
      status: 'Pending',
      image:  'assets/images/chrono.jpg'
    },
    {
      ref:    '#EV-88741',
      name:   'Savanna Botanicals Set',
      date:   'Dec 22, 2023',
      amount: 12000,
      status: 'Shipped',
      image:  'assets/images/botanicals.jpg'
    }
  ];

  toggleEdit(): void {
    // Open edit modal or navigate to edit form
    console.log('Edit profile info');
  }

  toggleNotif(key: keyof typeof this.notifications): void {
    this.notifications[key] = !this.notifications[key];
  }

  updatePassword(): void {
    // Navigate to change password page
    console.log('Update password');
  }

  manageDevices(): void {
    // Navigate to trusted devices page
    console.log('Manage devices');
  }
}
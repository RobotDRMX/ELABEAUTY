import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { AdminProductsService } from '../services-api/admin-products.service';
import { AdminHairstylesService } from '../services-api/admin-hairstyles.service';
import { AdminNailDesignsService } from '../services-api/admin-nail-designs.service';
import { AdminServicesService } from '../services-api/admin-services.service';
import { AdminUsersService } from '../services-api/admin-users.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private productsService = inject(AdminProductsService);
  private hairstylesService = inject(AdminHairstylesService);
  private nailDesignsService = inject(AdminNailDesignsService);
  private servicesService = inject(AdminServicesService);
  private usersService = inject(AdminUsersService);

  counts = signal({ products: 0, hairstyles: 0, nailDesigns: 0, services: 0, users: 0 });
  recentUsers = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    forkJoin({
      products:    this.productsService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      hairstyles:  this.hairstylesService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      nailDesigns: this.nailDesignsService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      services:    this.servicesService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      users:       this.usersService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
    }).subscribe(results => {
      this.counts.set({
        products:    (results.products as any).total ?? 0,
        hairstyles:  (results.hairstyles as any).total ?? 0,
        nailDesigns: (results.nailDesigns as any).total ?? 0,
        services:    (results.services as any).total ?? 0,
        users:       (results.users as any).total ?? 0,
      });
      this.loading.set(false);
    });

    this.usersService.findAll(1, 5, false).subscribe({
      next: res => this.recentUsers.set(res.data),
      error: () => {},
    });
  }
}

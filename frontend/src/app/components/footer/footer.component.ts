import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { LucideIcons } from '../../icons.provider';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIcons],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  private notif = inject(NotificationService);

  newsletterEmail: string = '';

  // Enlaces de atención al cliente
  customerServiceLinks = [
    { label: 'Contact Us', link: '/contacto', icon: 'phone' }, // Static string
    { label: 'FAQ', link: '/faq', icon: 'help-circle' }, // Static string
    { label: 'Shipping & Returns', link: '/envios', icon: 'truck' }, // Static string
    { label: 'Exchange Policy', link: '/cambios', icon: 'arrow-left-right' }, // Static string
    { label: 'Product Warranty', link: '/garantia', icon: 'award' }, // Static string
    { label: 'Size Guide', link: '/tallas', icon: 'ruler' } // Static string
  ];

  // Enlaces de información
  infoLinks = [
    { label: 'About Us', link: '/sobre-nosotros', icon: 'info' }, // Static string
    { label: 'Our Stores', link: '/tiendas', icon: 'store' }, // Static string
    { label: 'Beauty Blog', link: '/blog', icon: 'book-open' }, // Static string
    { label: 'Loyalty Program', link: '/lealtad', icon: 'crown' }, // Static string
    { label: 'Terms of Use', link: '/terminos-de-uso', icon: 'file-text' }, // Static string
    { label: 'Privacy Policy', link: '/privacidad', icon: 'shield' } // Static string
  ];

  // Redes sociales (inline SVG paths — Lucide has no brand icons)
  socialLinks = [
    { name: 'Facebook',  url: 'https://facebook.com/maybelline',  svgPath: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
    { name: 'Instagram', url: 'https://instagram.com/maybelline',  svgPath: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
    { name: 'TikTok',   url: 'https://tiktok.com/@maybelline',    svgPath: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1v-3.5a6.37 6.37 0 0 0-.8-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 10.86 4.48V12.9A8.28 8.28 0 0 0 19.59 15V11.5a4.83 4.83 0 0 1-4.42-1.64' },
    { name: 'YouTube',  url: 'https://youtube.com/maybelline',    svgPath: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z' },
    { name: 'Twitter',  url: 'https://twitter.com/maybelline',    svgPath: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
  ];

  // Métodos de pago (text labels only — brand SVGs not needed)
  paymentMethods = [
    { name: 'Visa' },
    { name: 'Mastercard' },
    { name: 'AMEX' },
    { name: 'PayPal' },
    { name: 'Apple Pay' },
  ];

  // Año actual para copyright
  currentYear: number = new Date().getFullYear();

  // Método para suscribir al newsletter
  subscribeNewsletter() {
    if (this.newsletterEmail) {
      this.notif.toast('Newsletter subscribed successfully!', 'success'); // Static string
      this.newsletterEmail = '';
    }
  }
}

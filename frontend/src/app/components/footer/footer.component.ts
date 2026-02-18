import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  // Email para newsletter
  newsletterEmail: string = '';

  // Enlaces de atención al cliente
  customerServiceLinks = [
    { label: 'Contáctanos', link: '/contacto', icon: 'fas fa-phone-alt' },
    { label: 'Preguntas Frecuentes', link: '/faq', icon: 'fas fa-question-circle' },
    { label: 'Envíos y Devoluciones', link: '/envios', icon: 'fas fa-truck' },
    { label: 'Política de Cambios', link: '/cambios', icon: 'fas fa-exchange-alt' },
    { label: 'Garantía de Productos', link: '/garantia', icon: 'fas fa-award' },
    { label: 'Guía de Tallas', link: '/tallas', icon: 'fas fa-ruler' }
  ];

  // Enlaces de información
  infoLinks = [
    { label: 'Sobre Nosotros', link: '/sobre-nosotros', icon: 'fas fa-info-circle' },
    { label: 'Nuestras Tiendas', link: '/tiendas', icon: 'fas fa-store' },
    { label: 'Blog de Belleza', link: '/blog', icon: 'fas fa-blog' },
    { label: 'Programa de Lealtad', link: '/lealtad', icon: 'fas fa-crown' },
    { label: 'Términos y Condiciones', link: '/terminos', icon: 'fas fa-file-contract' },
    { label: 'Política de Privacidad', link: '/privacidad', icon: 'fas fa-shield-alt' }
  ];

  // Redes sociales
  socialLinks = [
    { 
      name: 'Facebook', 
      url: 'https://facebook.com/maybelline',
      icon: 'fab fa-facebook-f'
    },
    { 
      name: 'Instagram', 
      url: 'https://instagram.com/maybelline',
      icon: 'fab fa-instagram'
    },
    { 
      name: 'TikTok', 
      url: 'https://tiktok.com/@maybelline',
      icon: 'fab fa-tiktok'
    },
    { 
      name: 'YouTube', 
      url: 'https://youtube.com/maybelline',
      icon: 'fab fa-youtube'
    },
    { 
      name: 'Twitter', 
      url: 'https://twitter.com/maybelline',
      icon: 'fab fa-twitter'
    }
  ];

  // Métodos de pago
  paymentMethods = [
    { name: 'Visa', icon: 'fab fa-cc-visa' },
    { name: 'Mastercard', icon: 'fab fa-cc-mastercard' },
    { name: 'American Express', icon: 'fab fa-cc-amex' },
    { name: 'PayPal', icon: 'fab fa-cc-paypal' },
    { name: 'Apple Pay', icon: 'fab fa-cc-apple-pay' }
  ];

  // Año actual para copyright
  currentYear: number = new Date().getFullYear();

  // Método para suscribir al newsletter
  subscribeNewsletter() {
    if (this.newsletterEmail) {
      console.log('Suscribiendo email:', this.newsletterEmail);
      // TODO: Implementar lógica de suscripción real
      alert('¡Gracias por suscribirte a MAYBELLINE! Pronto recibirás nuestras ofertas exclusivas y tips de belleza.');
      this.newsletterEmail = '';
    }
  }
}
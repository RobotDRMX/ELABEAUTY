import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent {

  categories = [
    {
      name: 'Labiales',
      count: '45 productos',
      faIcon: 'fas fa-kiss-wink-heart',
      searchKey: 'Labiales',
      gradient: 'linear-gradient(135deg, #ff4da6, #e6007e)'
    },
    {
      name: 'Ojos',
      count: '84 productos',
      faIcon: 'fas fa-eye',
      searchKey: 'Ojos',
      gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)'
    },
    {
      name: 'Rostro',
      count: '56 productos',
      faIcon: 'fas fa-palette',
      searchKey: 'Rostro',
      gradient: 'linear-gradient(135deg, #fb923c, #f97316)'
    },
    {
      name: 'Uñas',
      count: '64 productos',
      faIcon: 'fas fa-hand-sparkles',
      searchKey: 'Uñas',
      gradient: 'linear-gradient(135deg, #34d399, #059669)'
    },
    {
      name: 'Sombras',
      count: '52 productos',
      faIcon: 'fas fa-moon',
      searchKey: 'Sombras',
      gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
    },
    {
      name: 'Rubores',
      count: '36 productos',
      faIcon: 'fas fa-circle',
      searchKey: 'Rubores',
      gradient: 'linear-gradient(135deg, #f472b6, #ec4899)'
    }
  ];

  featuredProducts = [
    {
      name: 'Labial Líquido Mate',
      description: 'Fórmula ultra-pigmentada de larga duración. 24h sin retoques.',
      price: 249,
      badge: 'BEST SELLER',
      faIcon: 'fas fa-kiss-wink-heart',
      gradient: 'linear-gradient(135deg, #fff0f7, #ffe0ef)',
      iconColor: '#e6007e'
    },
    {
      name: 'Máscara Volumen Extremo',
      description: 'Pestañas hasta 10x más voluminosas. Fórmula enriquecida con keratina.',
      price: 199,
      badge: 'NUEVO',
      faIcon: 'fas fa-eye',
      gradient: 'linear-gradient(135deg, #f3f0ff, #ede9fe)',
      iconColor: '#7c3aed'
    },
    {
      name: 'Base Mate Natural',
      description: 'Cobertura total con acabado mate. SPF 15. 40 tonos disponibles.',
      price: 299,
      badge: 'TOP RATED',
      faIcon: 'fas fa-palette',
      gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
      iconColor: '#f97316'
    }
  ];

  brandFeatures = [
    {
      faIcon: 'fas fa-award',
      title: 'Calidad Garantizada',
      description: 'Productos dermatológicamente probados y certificados para todo tipo de piel.'
    },
    {
      faIcon: 'fas fa-leaf',
      title: 'Cruelty Free',
      description: 'Comprometidas con el bienestar animal. Sin pruebas en animales.'
    },
    {
      faIcon: 'fas fa-shipping-fast',
      title: 'Envío Express',
      description: 'Recibe tus productos en 24-48 horas con seguimiento en tiempo real.'
    }
  ];

  testimonials = [
    {
      text: 'Los labiales de ELA Beauty son increíbles. No se mueven en todo el día y los colores son espectaculares.',
      author: 'Ana G.',
      rating: 5,
      avatar: 'A'
    },
    {
      text: 'La base mate es perfecta para mi piel grasa. Me da cobertura natural sin que se sienta pesada.',
      author: 'Sofía M.',
      rating: 5,
      avatar: 'S'
    },
    {
      text: 'La máscara de pestañas es lo mejor que he probado. Las deja definidas y con volumen todo el día.',
      author: 'Valentina R.',
      rating: 5,
      avatar: 'V'
    }
  ];

  activeTestimonial = 0;

  setTestimonial(index: number) {
    this.activeTestimonial = index;
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}

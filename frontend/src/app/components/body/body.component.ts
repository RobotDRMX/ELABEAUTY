import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent {
  categories = [
    {
      id: 1,
      name: 'LABIALES',
      count: '45 productos',
      icon: '💄'
    },
    {
      id: 2,
      name: 'MÁSCARAS DE PESTAÑAS',
      count: '32 productos',
      icon: '👁️'
    },
    {
      id: 3,
      name: 'BASES Y CORRECTORES',
      count: '28 productos',
      icon: '🎨'
    },
    {
      id: 4,
      name: 'RUBORES',
      count: '36 productos',
      icon: '🍑'
    },
    {
      id: 5,
      name: 'SOMBRAS DE OJOS',
      count: '52 productos',
      icon: '✨'
    },
    {
      id: 6,
      name: 'ESMALTES DE UÑAS',
      count: '64 productos',
      icon: '💅'
    }
  ];

  featuredProducts = [
    {
      id: 1,
      name: 'Labial Líquido Mate',
      description: 'Labial líquido mate de larga duración - 24h',
      price: 249.00,
      badge: 'BEST SELLER',
      icon: '💋'
    },
    {
      id: 2,
      name: 'Máscara de Pestañas',
      description: 'Máscara de pestañas volumen extremo',
      price: 199.00,
      badge: 'NUEVO',
      icon: '👁️'
    },
    {
      id: 3,
      name: 'Base de Maquillaje',
      description: 'Base de maquillaje mate natural',
      price: 299.00,
      badge: 'TOP RATED',
      icon: '🎨'
    }
  ];

  brandFeatures = [
    {
      icon: '🏆',
      title: 'Calidad Garantizada',
      description: 'Productos dermatológicamente probados'
    },
    {
      icon: '🐇',
      title: 'Cruelty Free',
      description: 'Comprometidos con el bienestar animal'
    },
    {
      icon: '🚚',
      title: 'Envío Rápido',
      description: 'Recibe tus productos en 24-48 horas'
    }
  ];
}
import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
  getHomeData() {
    return {
      hero: {
        title: 'Ela Beauty - Tu Belleza Natural',
        subtitle: 'Descubre tu mejor versión con tratamientos premium personalizados',
        ctaText: 'Reserva Tu Primera Cita',
        secondaryCtaText: 'Ver Servicios',
        backgroundImage: '/assets/images/hero-bg.jpg',
        features: [
          { icon: 'spa', text: 'Tratamientos Personalizados' },
          { icon: 'stars', text: 'Productos Premium' },
          { icon: 'group', text: 'Expertos Certificados' },
        ]
      },
      stats: {
        happyClients: 1250,
        servicesDone: 5400,
        yearsExperience: 8,
        expertStaff: 12
      },
      featuredServices: [
        {
          id: 1,
          name: 'Facial Rejuvenecedor',
          description: 'Tratamiento antiedad con tecnología de punta',
          price: 120,
          duration: 90,
          category: 'facial',
          image: '/assets/services/facial-rejuvenecedor.jpg',
          highlights: ['Hidratación profunda', 'Reducción de arrugas', 'Brillo natural']
        },
        {
          id: 2,
          name: 'Masaje Relajante',
          description: 'Alivio de estrés y tensión muscular',
          price: 80,
          duration: 60,
          category: 'masajes',
          image: '/assets/services/masaje-relajante.jpg',
          highlights: ['Relajación profunda', 'Alivio de dolor', 'Mejora circulación']
        },
        {
          id: 3,
          name: 'Manicure & Pedicure Spa',
          description: 'Cuidado integral de manos y pies',
          price: 65,
          duration: 75,
          category: 'manicure',
          image: '/assets/services/manicure-spa.jpg',
          highlights: ['Exfoliación', 'Hidratación', 'Diseño personalizado']
        }
      ],
      testimonials: [
        {
          id: 1,
          name: 'María González',
          role: 'Cliente desde 2020',
          text: 'Increíble experiencia en Ela Beauty. El facial rejuvenecedor transformó mi piel. ¡Me siento 10 años más joven!',
          rating: 5,
          avatar: '/assets/testimonials/client1.jpg'
        },
        {
          id: 2,
          name: 'Ana Rodríguez',
          role: 'Cliente frecuente',
          text: 'El mejor spa de la ciudad. Atención personalizada y resultados visibles desde la primera sesión.',
          rating: 5,
          avatar: '/assets/testimonials/client2.jpg'
        },
        {
          id: 3,
          name: 'Laura Mendoza',
          role: 'Cliente corporativa',
          text: 'Llevo a todo mi equipo de trabajo. Perfecto para liberar el estrés y mejorar la productividad.',
          rating: 5,
          avatar: '/assets/testimonials/client3.jpg'
        }
      ],
      whyChooseUs: [
        {
          title: 'Expertos Certificados',
          description: 'Nuestro equipo cuenta con certificaciones internacionales y años de experiencia.',
          icon: 'verified'
        },
        {
          title: 'Productos Naturales',
          description: 'Usamos solo productos orgánicos y libres de químicos agresivos.',
          icon: 'eco'
        },
        {
          title: 'Tecnología Avanzada',
          description: 'Equipos de última generación para resultados óptimos y seguros.',
          icon: 'devices'
        },
        {
          title: 'Ambiente Relajante',
          description: 'Diseñamos espacios que promueven la relajación y el bienestar.',
          icon: 'mood'
        }
      ],
      bookingInfo: {
        title: 'Reserva Fácil y Rápida',
        steps: [
          { number: 1, text: 'Elige tu servicio' },
          { number: 2, text: 'Selecciona fecha y hora' },
          { number: 3, text: 'Recibe confirmación' }
        ],
        phone: '+1 (555) 123-4567',
        email: 'citas@elabeauty.com',
        workingHours: 'Lunes a Sábado: 9:00 AM - 8:00 PM'
      }
    };
  }

  getServicesPreview() {
    return {
      categories: [
        { id: 1, name: 'Tratamientos Faciales', count: 8 },
        { id: 2, name: 'Masajes Corporales', count: 6 },
        { id: 3, name: 'Spa & Bienestar', count: 5 },
        { id: 4, name: 'Manicure & Pedicure', count: 7 }
      ]
    };
  }
}
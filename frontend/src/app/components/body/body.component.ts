import { Component, inject, signal, HostListener, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIcons } from '../../icons.provider';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIcons, ScrollRevealDirective],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private revealObserver?: IntersectionObserver;

  scrollY = signal(0);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollY.set(window.pageYOffset);
  }

  ngAfterViewInit() {
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    this.el.nativeElement.querySelectorAll('.reveal').forEach((el: Element) => {
      this.revealObserver!.observe(el);
    });
  }

  ngOnDestroy() {
    this.revealObserver?.disconnect();
  }

  /* 
    Senior Design Note: 
    Using muted, sophisticated gradients that align with the HSL Master Palette.
  */
  categories = [
    { nameKey: 'Lips', count: 45, icon: 'heart', searchKey: 'Labiales', gradient: 'linear-gradient(135deg, #e6c2c2, #d4a5a5)' },
    { nameKey: 'Eyes', count: 84, icon: 'eye', searchKey: 'Ojos', gradient: 'linear-gradient(135deg, #d1c4e9, #b39ddb)' },
    { nameKey: 'Face', count: 56, icon: 'palette', searchKey: 'Rostro', gradient: 'linear-gradient(135deg, #ffe0b2, #ffcc80)' },
    { nameKey: 'Nails', count: 64, icon: 'sparkles', searchKey: 'Uñas', gradient: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)' },
    { nameKey: 'Shadows', count: 52, icon: 'moon', searchKey: 'Sombras', gradient: 'linear-gradient(135deg, #bbdefb, #90caf9)' },
    { nameKey: 'Blush', count: 36, icon: 'circle', searchKey: 'Rubores', gradient: 'linear-gradient(135deg, #f8bbd0, #f48fb1)' }
  ];

  featuredProducts = [
    {
      nameKey: 'Featured Product 1', descKey: 'High quality beauty product',
      price: 249, badgeKey: 'Bestseller', icon: 'heart',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f5eeee)', iconColor: '#d4a5a5'
    },
    {
      nameKey: 'Featured Product 2', descKey: 'New arrival in our collection',
      price: 199, badgeKey: 'New', icon: 'eye',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f0eef5)', iconColor: '#b39ddb'
    },
    {
      nameKey: 'Featured Product 3', descKey: 'Top rated by our customers',
      price: 299, badgeKey: 'Top', icon: 'palette',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f5f0ee)', iconColor: '#ffcc80'
    }
  ];

  brandFeatures = [
    { icon: 'award', titleKey: 'Quality', descKey: 'Premium ingredients' },
    { icon: 'leaf', titleKey: 'Cruelty Free', descKey: 'Ethical beauty' },
    { icon: 'truck', titleKey: 'Fast Shipping', descKey: 'Quick delivery' }
  ];
}

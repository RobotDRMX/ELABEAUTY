import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIcons } from '../../icons.provider';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIcons, TranslatePipe, ScrollRevealDirective],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent {
  private i18n = inject(I18nService);

  categories = [
    { nameKey: 'hero.lips', count: 45, icon: 'heart', searchKey: 'Labiales', gradient: 'linear-gradient(135deg, #ff4da6, #e6007e)' },
    { nameKey: 'hero.eyes', count: 84, icon: 'eye', searchKey: 'Ojos', gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { nameKey: 'hero.face', count: 56, icon: 'palette', searchKey: 'Rostro', gradient: 'linear-gradient(135deg, #fb923c, #f97316)' },
    { nameKey: 'hero.nails', count: 64, icon: 'sparkles', searchKey: 'Uñas', gradient: 'linear-gradient(135deg, #34d399, #059669)' },
    { nameKey: 'hero.shadows', count: 52, icon: 'moon', searchKey: 'Sombras', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
    { nameKey: 'hero.blush', count: 36, icon: 'circle', searchKey: 'Rubores', gradient: 'linear-gradient(135deg, #f472b6, #ec4899)' }
  ];

  featuredProducts = [
    {
      nameKey: 'featured.product1_name', descKey: 'featured.product1_desc',
      price: 249, badgeKey: 'featured.badge_bestseller', icon: 'heart',
      gradient: 'linear-gradient(135deg, #fff0f7, #ffe0ef)', iconColor: '#e6007e'
    },
    {
      nameKey: 'featured.product2_name', descKey: 'featured.product2_desc',
      price: 199, badgeKey: 'featured.badge_new', icon: 'eye',
      gradient: 'linear-gradient(135deg, #f3f0ff, #ede9fe)', iconColor: '#7c3aed'
    },
    {
      nameKey: 'featured.product3_name', descKey: 'featured.product3_desc',
      price: 299, badgeKey: 'featured.badge_top', icon: 'palette',
      gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', iconColor: '#f97316'
    }
  ];

  brandFeatures = [
    { icon: 'award', titleKey: 'philosophy.quality_title', descKey: 'philosophy.quality_desc' },
    { icon: 'leaf', titleKey: 'philosophy.cruelty_free_title', descKey: 'philosophy.cruelty_free_desc' },
    { icon: 'truck', titleKey: 'philosophy.shipping_title', descKey: 'philosophy.shipping_desc' }
  ];
}

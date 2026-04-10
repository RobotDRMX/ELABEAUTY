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

  /* 
    Senior Design Note: 
    Using muted, sophisticated gradients that align with the HSL Master Palette.
  */
  categories = [
    { nameKey: 'categories.lips', count: 45, icon: 'heart', searchKey: 'Labiales', gradient: 'linear-gradient(135deg, #e6c2c2, #d4a5a5)' },
    { nameKey: 'categories.eyes', count: 84, icon: 'eye', searchKey: 'Ojos', gradient: 'linear-gradient(135deg, #d1c4e9, #b39ddb)' },
    { nameKey: 'categories.face', count: 56, icon: 'palette', searchKey: 'Rostro', gradient: 'linear-gradient(135deg, #ffe0b2, #ffcc80)' },
    { nameKey: 'categories.nails', count: 64, icon: 'sparkles', searchKey: 'Uñas', gradient: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)' },
    { nameKey: 'categories.shadows', count: 52, icon: 'moon', searchKey: 'Sombras', gradient: 'linear-gradient(135deg, #bbdefb, #90caf9)' },
    { nameKey: 'categories.blush', count: 36, icon: 'circle', searchKey: 'Rubores', gradient: 'linear-gradient(135deg, #f8bbd0, #f48fb1)' }
  ];

  featuredProducts = [
    {
      nameKey: 'featured.product1_name', descKey: 'featured.product1_desc',
      price: 249, badgeKey: 'featured.badge_bestseller', icon: 'heart',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f5eeee)', iconColor: '#d4a5a5'
    },
    {
      nameKey: 'featured.product2_name', descKey: 'featured.product2_desc',
      price: 199, badgeKey: 'featured.badge_new', icon: 'eye',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f0eef5)', iconColor: '#b39ddb'
    },
    {
      nameKey: 'featured.product3_name', descKey: 'featured.product3_desc',
      price: 299, badgeKey: 'featured.badge_top', icon: 'palette',
      gradient: 'linear-gradient(135deg, #fcf9f7, #f5f0ee)', iconColor: '#ffcc80'
    }
  ];

  brandFeatures = [
    { icon: 'award', titleKey: 'philosophy.quality_title', descKey: 'philosophy.quality_desc' },
    { icon: 'leaf', titleKey: 'philosophy.cruelty_free_title', descKey: 'philosophy.cruelty_free_desc' },
    { icon: 'truck', titleKey: 'philosophy.shipping_title', descKey: 'philosophy.shipping_desc' }
  ];
}

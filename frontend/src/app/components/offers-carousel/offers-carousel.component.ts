import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OffersService } from '../../services/offers.service';
import { Offer } from '../../interfaces/offer.interface';
import { LucideIcons } from '../../icons.provider';

const AUTOPLAY_MS = 6000;

@Component({
  selector: 'app-offers-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIcons],
  templateUrl: './offers-carousel.component.html',
  styleUrls: ['./offers-carousel.component.scss']
})
export class OffersCarouselComponent implements OnInit, OnDestroy {
  private offersService = inject(OffersService);

  offers = signal<Offer[]>([]);
  activeIndex = signal(0);
  private autoplayTimer?: ReturnType<typeof setInterval>;

  readonly defaultCtaLabel = $localize`:@@offersCarouselCta:View offer`;
  readonly ariaGoToLabel = $localize`:@@offersCarouselGoTo:Go to offer`;

  ngOnInit() {
    this.offersService.getActive().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.startAutoplay();
      },
      error: () => this.offers.set([]),
    });
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  next() {
    const count = this.offers().length;
    if (!count) return;
    this.activeIndex.set((this.activeIndex() + 1) % count);
  }

  prev() {
    const count = this.offers().length;
    if (!count) return;
    this.activeIndex.set((this.activeIndex() - 1 + count) % count);
  }

  goTo(index: number) {
    this.activeIndex.set(index);
    this.restartAutoplay();
  }

  onMouseEnter() {
    this.stopAutoplay();
  }

  onMouseLeave() {
    this.restartAutoplay();
  }

  private startAutoplay() {
    this.stopAutoplay();
    if (this.offers().length > 1) {
      this.autoplayTimer = setInterval(() => this.next(), AUTOPLAY_MS);
    }
  }

  private restartAutoplay() {
    this.startAutoplay();
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }
}

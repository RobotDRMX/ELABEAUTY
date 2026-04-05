import {
  trigger, transition, style, animate, query, group
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ], { optional: true }),
      query(':enter', [
        animate('280ms 140ms cubic-bezier(0.25,0.46,0.45,0.94)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true }),
    ])
  ])
]);

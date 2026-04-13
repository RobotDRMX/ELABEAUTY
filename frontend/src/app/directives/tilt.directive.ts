import { Directive, ElementRef, HostListener, Renderer2, Input } from '@angular/core';

@Directive({
  selector: '[appTilt]',
  standalone: true
})
export class TiltDirective {
  @Input() tiltMax = 15; // Inclinación máxima en grados
  @Input() tiltPerspective = 1000; // Perspectiva 3D

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.1s ease-out');
    this.renderer.setStyle(this.el.nativeElement, 'transform-style', 'preserve-3d');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left; // posición x dentro del elemento
    const y = event.clientY - rect.top;  // posición y dentro del elemento

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -this.tiltMax;
    const rotateY = ((x - centerX) / centerX) * this.tiltMax;

    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(${this.tiltPerspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    );
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(${this.tiltPerspective}px) rotateX(0deg) rotateY(0deg)`
    );
  }
}

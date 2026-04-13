import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HairstylesService, Hairstyle } from '../../services/hairstyles.service';
import { RealtimeService } from '../../services/realtime.service';
import { SafeImagePipe } from '../../pipes/safe-image.pipe';
import { LucideIcons } from '../../icons.provider';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-hairstyles',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeImagePipe, LucideIcons, ScrollRevealDirective],
  templateUrl: './hairstyles.component.html',
  styleUrls: ['./hairstyles.component.scss']
})
export class HairstylesComponent implements OnInit, OnDestroy {
  private service = inject(HairstylesService);
  private realtime = inject(RealtimeService);
  realtimeSub?: Subscription;

  hairstyles: Hairstyle[] = [];
  filtered: Hairstyle[] = [];
  isLoading = true;
  error = '';
  activeCategory = '';
  expandedId: number | null = null;

  categories = ['Corte', 'Color', 'Peinado', 'Tratamiento'];

  ngOnInit() {
    this.realtimeSub = this.realtime.on('hairstyles:updated').subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy() {
    this.realtimeSub?.unsubscribe();
  }

  load() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.hairstyles = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los peinados. Verifica que el servidor esté corriendo.';
        this.isLoading = false;
      }
    });
  }

  setCategory(cat: string) {
    this.activeCategory = this.activeCategory === cat ? '' : cat;
    this.applyFilter();
  }

  applyFilter() {
    this.filtered = this.activeCategory
      ? this.hairstyles.filter(h => h.category === this.activeCategory)
      : [...this.hairstyles];
  }

  toggleExpand(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/hairstyle-placeholder.jpg';
  }

  formatProcess(process: string): string[] {
    return process.split('\n').filter(s => s.trim().length > 0);
  }
}

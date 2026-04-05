import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NailDesignsService, NailDesign } from '../../services/nail-designs.service';
import { RealtimeService } from '../../services/realtime.service';
import { SafeImagePipe } from '../../pipes/safe-image.pipe';
import { LucideIcons } from '../../icons.provider';

@Component({
  selector: 'app-nail-designs',
  standalone: true,
  imports: [CommonModule, SafeImagePipe, LucideIcons],
  templateUrl: './nail-designs.component.html',
  styleUrls: ['./nail-designs.component.scss']
})
export class NailDesignsComponent implements OnInit, OnDestroy {
  private service = inject(NailDesignsService);
  private realtime = inject(RealtimeService);
  private realtimeSub?: Subscription;

  designs: NailDesign[] = [];
  filtered: NailDesign[] = [];
  isLoading = true;
  error = '';
  activeStyle = '';
  expandedId: number | null = null;

  styles = ['Esmalte Semipermanente', 'Acrílico', 'Gel', 'Nail Art'];

  ngOnInit() {
    this.realtimeSub = this.realtime.on('nail-designs:updated').subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy() {
    this.realtimeSub?.unsubscribe();
  }

  load() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.designs = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los diseños. Verifica que el servidor esté corriendo.';
        this.isLoading = false;
      }
    });
  }

  setStyle(style: string) {
    this.activeStyle = this.activeStyle === style ? '' : style;
    this.applyFilter();
  }

  applyFilter() {
    this.filtered = this.activeStyle
      ? this.designs.filter(d => d.style === this.activeStyle)
      : [...this.designs];
  }

  toggleExpand(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/nails-placeholder.jpg';
  }

  formatProcess(process: string): string[] {
    return process.split('\n').filter(s => s.trim().length > 0);
  }
}

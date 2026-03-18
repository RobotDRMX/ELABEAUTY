import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminHairstylesService } from '../services-api/admin-hairstyles.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-hairstyles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hairstyles.component.html',
  styleUrls: ['./hairstyles.component.scss'],
})
export class HairstylesComponent implements OnInit {
  private service = inject(AdminHairstylesService);
  private fb = inject(FormBuilder);
  protected toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  limit = 20;
  showInactive = signal(false);
  loading = signal(false);
  showModal = signal(false);
  editingItem = signal<any>(null);
  modalError = signal('');
  saving = signal(false);
  form!: FormGroup;

  ngOnInit() { this.buildForm(); this.loadData(); }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',        Validators.required],
      description: [item?.description ?? '', Validators.required],
      process:     [item?.process ?? '',     Validators.required],
      duration:    [item?.duration ?? ''],
      price:       [item?.price ?? null,     Validators.min(0)],
      category:    [item?.category ?? ''],
      image_url:   [item?.image_url ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar peinados', 'error'); this.loading.set(false); },
    });
  }

  openCreate() { this.editingItem.set(null); this.buildForm(); this.modalError.set(''); this.showModal.set(true); }
  openEdit(item: any) { this.editingItem.set(item); this.buildForm(item); this.modalError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.modalError.set('');
    const dto = this.form.value;
    const action = this.editingItem() ? this.service.update(this.editingItem().id, dto) : this.service.create(dto);
    action.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadData(); this.toastService.show('Guardado correctamente'); },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error';
        if (err.status >= 500) this.toastService.show('Error del servidor', 'error');
        else this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}

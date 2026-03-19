import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminProductsService } from '../services-api/admin-products.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  private service = inject(AdminProductsService);
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

  ngOnInit() {
    this.buildForm();
    this.loadData();
  }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',        Validators.required],
      description: [item?.description ?? '', Validators.required],
      price:       [item?.price ?? 0,        [Validators.required, Validators.min(0)]],
      category:    [item?.category ?? '',    Validators.required],
      subcategory: [item?.subcategory ?? ''],
      stock:       [item?.stock ?? 0,        [Validators.required, Validators.min(0)]],
      image_url:   [item?.image_url ?? ''],
      rating:      [item?.rating ?? 0,       [Validators.min(0), Validators.max(5)]],
      target_age:  [item?.target_age ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar productos', 'error');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingItem.set(null);
    this.buildForm();
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(item: any) {
    this.editingItem.set(item);
    this.buildForm(item);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.modalError.set('');
    const dto = this.form.value;
    const action = this.editingItem()
      ? this.service.update(this.editingItem().id, dto)
      : this.service.create(dto);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
        this.toastService.show('Guardado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error del servidor';
        if (err.status >= 500) {
          this.toastService.show('Error del servidor, intenta de nuevo', 'error');
        } else {
          this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
        }
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}

import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminOffersService } from '../services-api/admin-offers.service';
import { AdminProductsService } from '../services-api/admin-products.service';
import { ToastService } from '../shared/toast.service';
import { NotificationService } from '../../../services/notification.service';
import { LucideIcons } from '../../../icons.provider';
import { computeDiscountPrice } from '../../../utils/offer-pricing';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideIcons],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss'],
})
export class OffersComponent implements OnInit {
  private service = inject(AdminOffersService);
  private productsService = inject(AdminProductsService);
  private fb = inject(FormBuilder);
  protected toastService = inject(ToastService);
  private notif = inject(NotificationService);

  items = signal<any[]>([]);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  limit = 20;
  showInactive = signal(false);
  loading = signal(false);

  products = signal<any[]>([]);

  showModal = signal(false);
  editingItem = signal<any>(null);
  modalError = signal('');
  saving = signal(false);

  form!: FormGroup;

  ngOnInit() {
    this.buildForm();
    this.loadData();
    this.loadProducts();
  }

  loadProducts() {
    this.productsService.findAll(1, 100, false).subscribe({
      next: res => this.products.set(res.data),
      error: () => this.toastService.show('Error al cargar productos', 'error'),
    });
  }

  get selectedProduct(): any {
    const id = +this.form?.get('product_id')?.value;
    return this.products().find(p => p.id === id) ?? null;
  }

  get discountPrice(): number | null {
    const product = this.selectedProduct;
    if (!product) return null;
    return computeDiscountPrice(product.price, this.form?.get('badge')?.value);
  }

  private toDatetimeLocal(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  buildForm(item?: any) {
    this.form = this.fb.group({
      title:       [item?.title ?? '',       Validators.required],
      subtitle:    [item?.subtitle ?? ''],
      description: [item?.description ?? ''],
      product_id:  [item?.product_id ?? '', Validators.required],
      cta_label:   [item?.cta_label ?? ''],
      cta_link:    [item?.cta_link ?? ''],
      badge:       [item?.badge ?? ''],
      tag:         [item?.tag ?? ''],
      start_date:  [this.toDatetimeLocal(item?.start_date), Validators.required],
      end_date:    [this.toDatetimeLocal(item?.end_date),   Validators.required],
      sort_order:  [item?.sort_order ?? 0,   [Validators.min(0)]],
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
        this.toastService.show('Error al cargar ofertas', 'error');
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
    const dto = {
      ...this.form.value,
      start_date: new Date(this.form.value.start_date).toISOString(),
      end_date: new Date(this.form.value.end_date).toISOString(),
    };
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
      next: () => { this.loadData(); this.toastService.show('Oferta desactivada', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Oferta restaurada'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  async remove(item: any) {
    const ok = await this.notif.confirm('Eliminar oferta', `¿Eliminar permanentemente "${item.title}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Oferta eliminada'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}

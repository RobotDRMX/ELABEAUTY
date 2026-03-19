import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService } from '../services-api/admin-users.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  private service = inject(AdminUsersService);
  protected toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  limit = 20;
  showInactive = signal(false);
  loading = signal(false);

  showRoleModal = signal(false);
  selectedUser = signal<any>(null);
  newRole = signal('user');
  roleError = signal('');
  saving = signal(false);

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar usuarios', 'error'); this.loading.set(false); },
    });
  }

  openRoleModal(user: any) {
    this.selectedUser.set(user);
    this.newRole.set(user.role);
    this.roleError.set('');
    this.showRoleModal.set(true);
  }

  closeRoleModal() { this.showRoleModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showRoleModal()) this.closeRoleModal(); }

  saveRole() {
    const user = this.selectedUser();
    if (!user) return;
    this.saving.set(true);
    this.service.updateRole(user.id, this.newRole()).subscribe({
      next: () => { this.saving.set(false); this.closeRoleModal(); this.loadData(); this.toastService.show('Rol actualizado'); },
      error: (err) => {
        this.saving.set(false);
        this.roleError.set(err?.error?.message ?? 'Error al actualizar rol');
      },
    });
  }

  deactivate(user: any) {
    this.service.deactivate(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(user: any) {
    this.service.restore(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(user: any) {
    if (!confirm(`¿Eliminar permanentemente a ${user.email}?`)) return;
    this.service.remove(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  canDelete(user: any): boolean { return !user.isActive && user.role !== 'admin'; }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}

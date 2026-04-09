import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type CheckoutStep = 'address' | 'payment' | 'review' | 'success';
export type PaymentMethod = 'card' | 'cash' | 'oxxo';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, TranslatePipe],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss']
})
export class CartComponent {
    cartService = inject(CartService);
    private notif = inject(NotificationService);
    private i18n = inject(I18nService);

    updatingId = signal<number | null>(null);

    // Checkout modal state
    showCheckout = signal(false);
    currentStep = signal<CheckoutStep>('address');
    processingPayment = signal(false);
    orderNumber = signal('');

    // Form data
    address = {
        firstName: '',
        lastName: '',
        street: '',
        colonia: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    };

    paymentMethod = signal<PaymentMethod>('card');

    card = {
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    };

    get cart() { return this.cartService.cart(); }
    get total() { return this.cartService.totalPrice(); }
    get finalTotal() { return this.total >= 500 ? this.total : this.total + 50; }
    get shipping() { return this.total >= 500 ? 0 : 50; }

    async updateQuantity(productId: number, quantity: number) {
        if (quantity === 0) {
            const confirmed = await this.notif.confirm(
                this.i18n.t('cart.remove_confirm_title'),
                this.i18n.t('cart.remove_confirm_msg'),
                { confirmText: this.i18n.t('common.delete'), cancelText: this.i18n.t('common.cancel'), danger: true }
            );
            if (!confirmed) return;
            this.updatingId.set(productId);
            this.cartService.removeItem(productId);
            this.updatingId.set(null);
            return;
        }
        this.updatingId.set(productId);
        this.cartService.updateQuantity(productId, quantity);
        this.updatingId.set(null);
    }

    removeItem(productId: number) {
        this.cartService.removeItem(productId);
    }

    async clearCart() {
        const ok = await this.notif.confirm(
            '¿Vaciar carrito?',
            'Se eliminarán todos los productos de tu carrito.',
            { confirmText: 'Vaciar', cancelText: 'Cancelar', danger: true }
        );
        if (ok) this.cartService.clearCart();
    }

    checkout() {
        this.currentStep.set('address');
        this.showCheckout.set(true);
    }

    closeCheckout() {
        if (this.currentStep() === 'success') {
            this.showCheckout.set(false);
            return;
        }
        this.showCheckout.set(false);
    }

    isAddressValid(): boolean {
        const a = this.address;
        return !!(a.firstName && a.lastName && a.street && a.colonia && a.city && a.state && a.zip && a.phone);
    }

    isPaymentValid(): boolean {
        if (this.paymentMethod() === 'card') {
            return !!(this.card.number.length >= 16 && this.card.name && this.card.expiry && this.card.cvv.length >= 3);
        }
        return true;
    }

    goToStep(step: CheckoutStep) {
        this.currentStep.set(step);
    }

    formatCardNumber(event: Event) {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').slice(0, 16);
        value = value.replace(/(.{4})/g, '$1 ').trim();
        this.card.number = value;
        input.value = value;
    }

    formatExpiry(event: Event) {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
        this.card.expiry = value;
        input.value = value;
    }

    maskedCard(): string {
        const clean = this.card.number.replace(/\s/g, '');
        if (clean.length < 4) return '**** **** **** ****';
        const last4 = clean.slice(-4);
        return `**** **** **** ${last4}`;
    }

    async confirmOrder() {
        this.processingPayment.set(true);
        this.currentStep.set('review');

        // Simulate payment processing steps
        await this.delay(2500);
        this.processingPayment.set(false);

        const num = Math.floor(100000 + Math.random() * 900000);
        this.orderNumber.set(`ELA-${num}`);
        this.currentStep.set('success');
        this.cartService.clearCart();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    paymentLabel(): string {
        const map: Record<PaymentMethod, string> = {
            card: 'Tarjeta de crédito/débito',
            cash: 'Efectivo en tienda',
            oxxo: 'Pago en OXXO'
        };
        return map[this.paymentMethod()];
    }

    stepIndex(): number {
        const map: Record<CheckoutStep, number> = { address: 0, payment: 1, review: 2, success: 3 };
        return map[this.currentStep()];
    }
}

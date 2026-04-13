import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { SafeImagePipe } from '../../pipes/safe-image.pipe';

type CheckoutStep = 'address' | 'payment' | 'review' | 'success';
type PaymentMethod = 'card' | 'transfer' | 'paypal' | 'cash' | 'oxxo';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, TruncatePipe, SafeImagePipe],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss']
})
export class CartComponent {
    cartService = inject(CartService);
    private notif = inject(NotificationService);

    updatingId = signal<number | null>(null);
    showCheckout = signal(false);
    currentStep = signal<CheckoutStep>('address');
    paymentMethod = signal<PaymentMethod>('card');
    processingPayment = signal(false);
    addressSubmitted = false;
    orderNumber = signal('');

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

    card = {
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    };

    cart = computed(() => this.cartService.cart());
    total = computed(() => this.cartService.totalPrice());

    shipping = computed(() => {
        return this.total() >= 500 ? 0 : 50;
    });

    finalTotal = computed(() => {
        return this.total() + this.shipping();
    });

    shippingProgress = computed(() => {
        const progress = (this.total() / 500) * 100;
        return Math.min(progress, 100);
    });

    async updateQuantity(productId: number, quantity: number) {
        if (quantity === 0) {
            const confirmed = await this.notif.confirm(
                'Remove Item',
                'Are you sure you want to remove this item from your cart?',
                { confirmText: 'Delete', cancelText: 'Cancel', danger: true }
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
            'Empty Cart?',
            'All items will be removed from your cart.',
            { confirmText: 'Empty', cancelText: 'Cancel', danger: true }
        );
        if (ok) this.cartService.clearCart();
    }

    checkout() {
        this.showCheckout.set(true);
        this.currentStep.set('address');
    }

    closeCheckout() {
        this.showCheckout.set(false);
    }

    goToStep(step: CheckoutStep) {
        if (step === 'payment') {
            this.addressSubmitted = true;
            if (!this.isAddressValid()) return;
        }
        this.currentStep.set(step);
    }

    isAddressValid(): boolean {
        return !!(this.address.firstName && this.address.lastName && this.address.street && 
               this.address.colonia && this.address.city && this.address.state && 
               this.address.zip.length === 5 && this.isPhoneValid());
    }

    isPhoneValid(): boolean {
        return this.address.phone.length >= 10;
    }

    isPaymentValid(): boolean {
        if (this.paymentMethod() === 'card') {
            return !!(this.card.number.length >= 16 && this.card.name && this.card.expiry.length === 5 && this.card.cvv.length >= 3);
        }
        return true;
    }

    formatCardNumber(event: any) {
        let value = event.target.value.replace(/\D/g, '');
        let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
        this.card.number = formatted.substring(0, 19);
    }

    formatExpiry(event: any) {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        this.card.expiry = value.substring(0, 5);
    }

    maskedCard() {
        if (!this.card.number) return '**** **** **** ****';
        const last4 = this.card.number.slice(-4);
        return `**** **** **** ${last4}`;
    }

    async confirmOrder() {
        this.processingPayment.set(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.orderNumber.set('EB-' + Math.random().toString(36).substring(2, 9).toUpperCase());
        this.cartService.clearCart();
        this.currentStep.set('success');
        this.processingPayment.set(false);
    }

    paymentLabel(): string {
        const map: Record<PaymentMethod, string> = {
            card: 'Credit/Debit Card',
            transfer: 'Bank Transfer',
            paypal: 'PayPal',
            cash: 'Cash on Delivery',
            oxxo: 'OXXO Pay'
        };
        return map[this.paymentMethod()];
    }

    stepIndex(): number {
        const map: Record<CheckoutStep, number> = { address: 0, payment: 1, review: 2, success: 3 };
        return map[this.currentStep()];
    }
}

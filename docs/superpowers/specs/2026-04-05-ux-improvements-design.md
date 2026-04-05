# ELA Beauty — UX Improvements Design Spec
**Date:** 2026-04-05  
**Scope:** Frontend-only improvements across security, normalization, and UX  
**Priority:** Security → Normalization → UX

---

## 1. Normalization

### 1.1 Login i18n + Icon consistency
- Migrate all hardcoded Spanish strings in `login.component.html` to `| translate` pipe
- Replace `🔑` emoji with `<lucide-icon name="key-round">` for Passkey button
- Replace `📷` emoji with `<lucide-icon name="camera">` for facial recognition button
- Applies to: `login.component.html`

### 1.2 Cart and Profile icon consistency
- `cart.component.html`: replace inline SVG trash icon with `<lucide-icon name="trash-2">`, info icons with `<lucide-icon name="info">` and `<lucide-icon name="circle-check">`
- `profile.component.html`: replace `🔑` with `<lucide-icon name="key-round">`, `📷` with `<lucide-icon name="camera">`

### 1.3 Checkout i18n + field validation + autocomplete
- Migrate all hardcoded strings in checkout modal to `| translate`
  - Step labels: "Envío", "Pago", "Confirmar"
  - Form labels, placeholders, info messages (OXXO, efectivo)
- Add inline error messages per field (same pattern as login form)
- Add `autocomplete` attributes:
  - `given-name`, `family-name`, `street-address`, `address-level2`, `address-level1`, `postal-code`, `tel` on address fields
  - `cc-number`, `cc-name`, `cc-exp`, `autocomplete="off"` on CVV field

### 1.4 Show/hide password toggle
- Add toggle button inside all `type="password"` inputs across: login, register, password reset
- Button uses `<lucide-icon name="eye">` (hidden) / `<lucide-icon name="eye-off">` (visible)
- Toggles `input.type` between `"password"` and `"text"`
- Applies to all auth forms

### 1.5 Button system normalization
- Define 3 canonical button classes: `btn-primary`, `btn-secondary`, `btn-ghost`
- `btn-maybelline` kept as SCSS `@extend btn-primary` alias (no breaking changes)
- Replace across all components:
  - `btn-maybelline` → `btn-primary`
  - `btn-outline` → `btn-secondary`
  - `btn-biometric` → `btn-ghost`
  - `suggestion-btn`, `apply-price-btn`, `clear-filters-btn` → appropriate variant
- Define in global `_buttons.scss` partial

### 1.6 Section spacing variables
- Add to global CSS variables:
  ```scss
  --section-spacing-sm: 3rem;
  --section-spacing-md: 5rem;
  --section-spacing-lg: 7rem;
  ```
- Apply `padding: var(--section-spacing-md) 0` consistently to all `<section>` elements in `body.component.scss` and page-level stylesheets

### 1.7 Remove testimonials section
- Remove the entire testimonials `<section>` from `body.component.html`
- Remove associated SCSS, component data (testimonials array, activeTestimonial, getStars, setTestimonial) from `body.component.ts`
- Remove testimonial i18n keys from all language files

---

## 2. Security

### 2.1 Top bar dead links → disabled buttons
- Replace `<a href="#">` links ("Rastrear pedido", "Ayuda", "Contacto") with `<button>` elements
- Apply `disabled` attribute and `cursor: not-allowed` styling
- Show tooltip on hover: "Próximamente" (translated via i18n)
- Use `<lucide-icon>` for their icons (already present as inline SVGs)

### 2.2 Autocomplete attributes on auth forms
- `login.component.html`:
  - Email input: `autocomplete="email"`
  - Password input: `autocomplete="current-password"`
- `register.component.html`:
  - Email input: `autocomplete="email"`
  - Password input: `autocomplete="new-password"`
  - Confirm password: `autocomplete="new-password"`
- Checkout CVV: `autocomplete="off"` (covered in 1.3)

### 2.3 Dynamic page titles per route
- Inject Angular `Title` service in each page component
- Set title on `ngOnInit` using i18n: `this.title.setTitle(this.i18n.t('page.title.home') + ' — ELA Beauty')`
- Update title when language changes (subscribe to lang signal)
- Title map:

| Route | i18n key |
|-------|----------|
| `/` | `page.title.home` |
| `/busqueda` | `page.title.search` |
| `/carrito` | `page.title.cart` |
| `/favoritos` | `page.title.favorites` |
| `/perfil` | `page.title.profile` |
| `/auth/login` | `page.title.login` |
| `/auth/register` | `page.title.register` |
| `/peinados` | `page.title.hairstyles` |
| `/disenos-unas` | `page.title.nail_designs` |
| `/admin` | `page.title.admin` |

### 2.4 Auto-logout on inactivity
- New `InactivityService` in `frontend/src/app/services/inactivity.service.ts`
- Listens to: `mousemove`, `keydown`, `scroll`, `touchstart` on `document`
- Timeout: 30 minutes for regular users, 15 minutes for admin routes
- At T-5 minutes: show warning modal "Tu sesión cerrará en 5 minutos por inactividad. ¿Deseas continuar?" with "Seguir conectado" button that resets the timer
- At T=0: call `AuthService.logout()`, redirect to `/auth/login` with query param `?reason=inactivity`
- Login page reads `reason` param and shows toast: "Sesión cerrada por inactividad"
- Service starts on login, stops on logout
- Only active when user `isAuthenticated`

---

## 3. UX

### 3.1 Mobile filter drawer (search page)
- Below 768px breakpoint:
  - Hide `.filters-sidebar` from normal flow
  - Show "Filtros" button above product grid with `<lucide-icon name="sliders-horizontal">` and active filter count badge
  - Clicking opens a bottom sheet overlay with same filter content
  - Bottom sheet: `position: fixed`, slides up from bottom, backdrop overlay
  - Close via `<lucide-icon name="x">` button or clicking backdrop
- Above 768px: no change to current sidebar layout

### 3.2 Empty state improvements
**Cart empty:**
- Keep existing icon + message
- Add below: row of 3 category chips (Labiales, Ojos, Rostro) as `<a>` links to `/busqueda?category=X`
- Uses existing categories array from body component (no new data)

**Favorites empty:**
- Add motivational line: `{{ 'favorites.empty_hint' | translate }}`
- Add same 3 category chips below

### 3.3 Mobile hamburger menu
- Below 768px:
  - Hide `.main-nav` and `.header-top` bar
  - Show `<lucide-icon name="menu">` button next to logo
- Clicking opens a drawer sliding in from the right side containing:
  - Nav links (vertical list)
  - Language selector
  - Theme selector
  - Auth links or user name + logout
- Close via `<lucide-icon name="x">` or clicking outside
- Drawer managed by signal `mobileMenuOpen` in `header.component.ts`

### 3.4 Cart quantity: trash icon at quantity 1
- When `item.quantity === 1`: render `<lucide-icon name="trash-2">` instead of `−` on the decrement button
- Clicking it opens existing confirmation modal: "¿Eliminar este producto del carrito?"
- When `item.quantity > 1`: render `<lucide-icon name="minus">` (normal behavior)
- Add `[disabled]="item.quantity >= item.product.stock"` on `+` button with title tooltip "Sin más stock disponible"

### 3.5 Loading feedback on cart and favorites actions
**Add to cart / favorites toggle buttons:**
- Add `isLoading` signal per product card (keyed by product id)
- While loading: show `<lucide-icon name="loader-circle">` with CSS `animation: spin 1s linear infinite`
- On success: show `<lucide-icon name="check">` for 1500ms, then restore original icon
- Disable button during request

**Cart quantity controls:**
- Add `updatingId` signal in cart component
- Disable both `+` and `−` for the item being updated while request is in flight

### 3.6 Free shipping progress bar
- Replace text hint in cart summary with a progress bar component
- Progress: `Math.min((total / 500) * 100, 100)%`
- Bar fill uses `var(--primary-color)`
- Shows amount remaining: "¡Solo faltan {{ 500 - total | currency:'MXN' }}!"
- At 100%: bar fills, message switches to success state with `<lucide-icon name="circle-check">`
- Animated fill transition: `transition: width 0.4s ease`

### 3.7 Profile: "Historial de compras" placeholder
- Rename section from "Pedidos recientes" to `{{ 'profile.order_history' | translate }}`
- Replace empty state content with:
  - `<lucide-icon name="clock" [size]="36">`
  - Text: `{{ 'profile.order_history_soon' | translate }}` → "Próximamente podrás ver el historial de tus pedidos aquí"
- Remove "Ir a comprar" button from this section

### 3.8 404 page + unauthorized redirect
**404 page:**
- New standalone component: `frontend/src/app/pages/not-found/not-found.component.ts`
- Content: `<lucide-icon name="file-question" [size]="64">`, title, subtitle, `btn-primary` → `/`
- Register `{ path: '**', component: NotFoundComponent }` at end of `app.routes.ts`
- All text via i18n

**Admin unauthorized:**
- In `adminGuard`: instead of silent redirect to `/`, navigate to `/` with state `{ unauthorized: true }`
- `AppComponent` reads navigation state and shows error toast: "No tienes permisos para acceder a esa sección"

### 3.9 Contextual empty search messages
- In `search-results.component.ts`: add computed property `emptyReason` that returns one of: `'text'`, `'price'`, `'category+text'`, `'stock'`, `'generic'`
- Logic:
  - `'text'`: `filters.q` is set and no other filters
  - `'price'`: `minPrice` or `maxPrice` set
  - `'category+text'`: both `category` and `q` set
  - `'stock'`: `onlyInStock === true`
  - `'generic'`: fallback
- Template renders different message + targeted "reset" button per reason
- All messages via i18n

### 3.10 Back-to-top button
- New standalone component: `frontend/src/app/components/ui/back-to-top.component.ts`
- Listens to `window.scroll` event
- Shows when `scrollY > 400`, hides otherwise
- Transition: `opacity` + `translateY` (respects `prefers-reduced-motion`)
- Click: `window.scrollTo({ top: 0, behavior: 'smooth' })`
- Icon: `<lucide-icon name="arrow-up">`
- Positioned `fixed` bottom-right, above toast notifications
- Added once in `app.component.html`

---

## Implementation Notes

- All new text strings must be added to all 8 language files (ES, EN, FR, PT, JA, DE, RU, KO)
- Button normalization (1.5) should be done before other component changes to avoid conflicts
- InactivityService (2.4) must be carefully tested to not trigger during automated tests
- Mobile breakpoint is consistently 768px throughout the app
- No backend changes required for any of these improvements

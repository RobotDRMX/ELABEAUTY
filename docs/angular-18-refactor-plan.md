# Refactoring Plan: Ela Beauty Frontend to Angular 18+

## Overall Goal:
Migrate the Angular 17.3 frontend to Angular 18+ using zoneless/signals architecture, standalone components, and modern UI libraries (Material/CDK/Tailwind), while enhancing performance, UX, and accessibility.

## Phase 1: Project Setup & Core Upgrades

### 1.1. Upgrade Angular
*   **Task:** Upgrade the Angular project to version 18.
*   **Details:** Follow the official Angular update guide.
*   **Verification:** `ng version` shows 18.x.x.

### 1.2. Migrate to Zoneless Execution
*   **Task:** Update `main.ts` for zoneless execution.
*   **Details:** Remove `zone.js` import. Modify `bootstrapApplication(AppComponent, { providers: [provideZoneChangeDetection({ eventCoalescing: true })] });` (or equivalent for Angular 18 if `provideZoneChangeDetection` is removed from `bootstrapApplication` directly).
*   **Verification:** Application runs without Zone.js. Confirm `NgZone` is not used implicitly or explicitly unless absolutely necessary.

### 1.3. Tooling Upgrade (Nx/Vite)
*   **Task:** Introduce Nx workspace and integrate Vite.
*   **Details:**
    *   If not already an Nx workspace, convert it (`npx create-nx-workspace --preset=angular`).
    *   Configure `angular.json` or `project.json` for Vite build and serve if Nx doesn't handle it by default for Angular 18.
*   **Verification:** `nx build frontend` and `nx serve frontend` work with Vite. Faster build/serve times observed.

### 1.4. Standalone Components & APIs
*   **Task:** Ensure all existing components are `standalone: true` and replace NgModules.
*   **Details:**
    *   Confirm `app.component.ts` is `standalone: true`.
    *   Iterate through all components, directives, and pipes, ensuring they are `standalone: true` and import their dependencies directly.
    *   Remove all `NgModule` declarations where possible, especially in feature modules.
    *   Provide all global services and features directly in `app.config.ts` using functions like `provideHttpClient()`, `provideAnimations()`, `provideRouter()`, etc.
*   **Verification:** No `NgModule` errors. Application bootstraps successfully with `app.config.ts`.

### 1.5. Tailwind CSS Integration
*   **Task:** Add Tailwind CSS to the project.
*   **Details:**
    *   Install Tailwind CSS and its peer dependencies.
    *   Configure `tailwind.config.js` with project content paths and any custom theme extensions (colors, fonts, breakpoints).
    *   Import Tailwind directives into `styles.scss`.
    *   Start replacing custom SCSS for layout, spacing, and responsive design with Tailwind utility classes.
*   **Verification:** Tailwind classes are applied correctly. `tailwind.config.js` is properly configured.

## Phase 2: Mandatory Feature Migration & Enhancement

### 2.1. Dark/Light Themes
*   **Task:** Refactor theme switching to use Angular signals.
*   **Details:**
    *   **Keep current CSS variable approach:** The existing HSL-based CSS variable theme system is robust.
    *   **Create `ThemeService`:** Develop an Angular service (`theme.service.ts`) with a `signal<string>` (e.g., `currentTheme`) to manage the active theme ('light', 'dark').
    *   **Implement `effect`:** In `ThemeService` or `app.component.ts`, use an `effect` to react to `currentTheme` signal changes and add/remove the `data-theme` attribute on `document.documentElement` (or `document.body`).
    *   **Update UI elements:** Ensure any UI elements (e.g., a theme toggle switch) interact with the `ThemeService`.
*   **Verification:** Theme toggles smoothly and correctly throughout the application. CSS variables are applied as expected.

### 2.2. Colorblind Filters
*   **Task:** Refactor colorblind filter switching to use Angular signals.
*   **Details:**
    *   **Keep current CSS variable approach:** The HSL-based colorblind filters are well-implemented in `styles.scss`.
    *   **Create `ColorblindService`:** Develop an Angular service (`colorblind.service.ts`) with a `signal<string>` (e.g., `activeFilter`) to manage the active filter type ('none', 'protanopia', etc.).
    *   **Implement `effect`:** Use an `effect` to react to `activeFilter` signal changes and add/remove the `data-theme` attribute (with the filter type) on `document.documentElement`.
    *   **Update UI elements:** Ensure any UI elements (e.g., a dropdown for colorblind options) interact with the `ColorblindService`.
*   **Verification:** Colorblind filters apply correctly and instantly when selected.

### 2.3. Official Angular i18n with Lazy Chunks
*   **Task:** Migrate from custom `I18nService` to official Angular i18n with lazy-loaded translation chunks.
*   **Details:**
    *   **Remove custom `I18nService`:** Delete `frontend/src/app/services/i18n.service.ts` and update all imports.
    *   **Configure `@angular/localize`:**
        *   Install `@angular/localize`.
        *   Add `providei18n` to `app.config.ts` (or `provideAngularLocale` in A18+).
        *   Configure `angular.json` for i18n build processes, specifying source locale and target locales.
    *   **Extract messages:** Run `ng extract-i18n` to generate base translation files (`messages.xlf`).
    *   **Translate existing content:** Copy translations from `assets/i18n/{lang}.json` into the new `.xlf` files for each language.
    *   **Implement lazy loading for translations:** Configure Angular router to load different application versions based on locale prefix in the URL (e.e., `/es/home`, `/en/home`), ensuring translation chunks are loaded with the specific locale. This typically involves multiple build configurations.
    *   **Update templates:** Replace custom `t()` calls with Angular's `i18n` attribute for static text and `$localize` tag functions for dynamic/interpolated text.
    *   **Language Switcher:** Redesign the language switch component to use Angular's i18n mechanisms for changing the active locale, possibly by redirecting to the appropriate locale-prefixed URL.
*   **Verification:**
    *   `ng build --configuration=es` (and other locales) builds successfully.
    *   Application loads in different languages.
    *   Translations are applied correctly.
    *   Lazy loading of translations is confirmed (e.g., via network tab in browser dev tools).

## Phase 3: Senior Improvements & UX/UI Enhancements

### 3.1. UX: Signals for Reactive State
*   **Task:** Migrate state management to Angular signals.
*   **Details:**
    *   Review all services and components using `BehaviorSubject`, `Subject`, or other `RxJS` primitives for local state.
    *   Replace them with `signal()` for read/write state and `computed()` for derived state.
    *   Utilize `RxJS interop` for scenarios where observables are still necessary (e.g., HTTP calls) and convert results to signals.
    *   Ensure all components are using `OnPush` change detection (should be automatic with zoneless and standalone).
*   **Verification:** Application state is managed reactively with signals. Reduced reliance on `async` pipe where signals can be used directly.

### 3.2. Animations (`@angular/animations`)
*   **Task:** Enhance existing animations and add new ones.
*   **Details:**
    *   **Route Transitions:** Review and enhance `routeAnimations` in `app.component.ts` (if needed) for more sophisticated page transitions (e.g., slide, fade, or custom effects).
    *   **Stagger in Lists:** Implement `query` and `stagger` functions from `@angular/animations` for smooth, sequential appearance of items in lists (e.e., product grids, blog posts).
    *   **Micro-interactions:** Add subtle animations to interactive elements like buttons, links, and form inputs (e.g., hover effects, focus states).
*   **Verification:** Animations are smooth, performant, and enhance the user experience without feeling sluggish.

### 3.3. Design Elements
*   **Task:** Implement advanced design elements.
*   **Details:**
    *   **Hero Parallax:** Create a parallax scrolling effect for hero sections on relevant pages (e.g., homepage). This can be achieved with CSS `background-attachment: fixed` or a simple Angular directive listening to scroll events.
    *   **Cards Hover 3D:** Develop an Angular directive or use CSS transforms to create a subtle 3D tilt effect on product cards or other interactive card elements when hovered.
    *   **Infinite Scroll Products (CDK Virtual Scroll):**
        *   Identify product listing pages (`pages/products`, `pages/category`, etc.).
        *   Integrate `@angular/cdk/scrolling` and `cdk-virtual-scroll-viewport`.
        *   Refactor the product fetching service to support pagination and load more data as the user scrolls, integrating with the virtual scroll viewport.
*   **Verification:**
    *   Parallax effect is visible and smooth.
    *   Cards exhibit 3D hover effect.
    *   Product lists load data efficiently on scroll without performance degradation.

### 3.4. Accessibility (WCAG AA, ARIA)
*   **Task:** Conduct an accessibility audit and implement improvements.
*   **Details:**
    *   **Audit:** Use browser developer tools (Lighthouse, Axe DevTools) to identify accessibility issues across key pages.
    *   **ARIA Attributes:** Ensure proper use of ARIA roles, states, and properties for custom interactive components and to convey structure to screen readers.
    *   **Keyboard Navigation:** Verify all interactive elements are reachable and operable via keyboard.
    *   **Focus Management:** Ensure logical focus order and visible focus indicators.
    *   **Semantic HTML:** Use appropriate HTML5 semantic elements.
    *   **Material Components:** Leverage the built-in accessibility of Angular Material components (if used).
*   **Verification:** Lighthouse accessibility score improves. Key user flows are navigable and understandable with screen readers and keyboard only.

### 3.5. Performance Optimizations
*   **Task:** Implement `defer` blocks and ensure build optimization.
*   **Details:**
    *   **Defer Blocks (`@defer`):**
        *   Identify sections of templates that are not critical for initial load or are conditionally displayed.
        *   Wrap them in `@defer` blocks with appropriate triggers (`on idle`, `on viewport`, `on interaction`, `on timer`, `when` for conditions).
    *   **Build Optimization (esbuild/Vite):**
        *   Confirm Angular CLI is configured to use esbuild for production builds.
        *   Leverage Vite's capabilities for tree-shaking, code splitting, and asset optimization.
*   **Verification:** Initial load times decrease. Lighthouse metrics (FCP, LCP, TBT) show improvement. Bundle size is optimized.

### 3.6. Responsive Design (Tailwind + breakpoints)
*   **Task:** Ensure robust responsive layouts.
*   **Details:**
    *   **Tailwind Utility Classes:** Use Tailwind's responsive prefixes (e.g., `sm:flex`, `lg:grid-cols-3`) extensively for styling layouts across different screen sizes.
    *   **Custom Breakpoints:** Define any necessary custom breakpoints in `tailwind.config.js` to match specific design requirements beyond Tailwind's defaults.
    *   **Viewport Meta Tag:** Ensure `index.html` has the correct viewport meta tag.
*   **Verification:** Layouts adapt correctly and aesthetically on various devices and screen resolutions.

## Verification Steps (General)

*   **Unit Tests:** Ensure existing unit tests pass. Write new unit tests for migrated logic (services, components with signals).
*   **End-to-End Tests:** Update existing e2e tests (if any) or create new ones to cover critical user flows, especially theme switching, language change, and product browsing.
*   **Manual Testing:**
    *   Verify all pages render correctly in light/dark mode.
    *   Verify all colorblind filters apply correctly.
    *   Verify language switching works for all supported languages.
    *   Test core user flows (product browsing, adding to cart, checkout) for functionality and performance.
    *   Check responsiveness across various device sizes.
    *   Verify accessibility with screen readers and keyboard navigation.
*   **Performance Audits:** Use Lighthouse or similar tools to measure performance metrics (FCP, LCP, CLS, TBT) before and after refactoring to quantify improvements.
*   **Code Review:** Ensure code adheres to Angular best practices (signals, standalone, good performance patterns).

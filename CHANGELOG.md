# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/) (SemVer).

Ver [docs/versionado.md](docs/versionado.md) para la convención de commits, la política
de versiones y el flujo de ramas.

## [Unreleased]

### Added
- Búsqueda de productos por relevancia usando Postgres Full-Text Search + `pg_trgm`
  (tolerancia a errores tipográficos, ranking por relevancia), en reemplazo del `LIKE` plano.
- Módulo de **ofertas de temporada**: entidad y endpoints públicos (`GET /offers/active`),
  submódulo de administración (`admin/offers`) y carrusel en la página de inicio.
- Página de administración de ofertas (`/admin/ofertas`) con alta, edición, desactivación,
  restauración y eliminación.
- `CHANGELOG.md` y guía de versionamiento (`docs/versionado.md`).

## [0.1.0] - 2026-07-17

Primera versión documentada del proyecto. Resume el estado acumulado del desarrollo hasta
esta fecha (171 commits desde el inicio del repositorio).

### Added
- API REST con NestJS: autenticación (JWT + cookies HttpOnly, refresh dual 15m/7d, WebAuthn,
  reCAPTCHA v3), gestión de roles (RBAC) y guards de administrador.
- Módulos de catálogo: productos, servicios, peinados (hairstyles) y diseños de uñas
  (nail-designs), cada uno con su contraparte de administración (CRUD).
- Carrito de compras, favoritos, proceso de checkout completo con validación.
- Blog, galería, contactos y home con datos dinámicos.
- Notificaciones en tiempo real vía Server-Sent Events (`/events/stream`).
- Integración con Supabase (Postgres, envío de correos, validación OTP).
- Frontend Angular 18 con i18n oficial (10 idiomas), diseño editorial con tokens HSL,
  animaciones, modo claro/oscuro y temas de accesibilidad.
- Panel de administración con dashboard, gestión de usuarios, productos, servicios,
  peinados y diseños de uñas.

### Fixed
- Múltiples correcciones de estabilidad (hidratación NG0908, zoneless, CSP), seguridad
  (rate limiting, whitelist de columnas de orden en búsqueda para prevenir inyección SQL,
  validación de contraseñas), i18n y despliegue (Vercel, CORS).

### Security
- Helmet con CSP estricta, `ThrottlerModule` (rate limiting global), `GlobalExceptionFilter`
  para respuestas de error normalizadas, cookies HttpOnly para tokens.

[Unreleased]: https://github.com/RobotDRMX/ELABEAUTY/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/RobotDRMX/ELABEAUTY/releases/tag/v0.1.0

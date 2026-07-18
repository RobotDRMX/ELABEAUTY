# Guía de versionamiento

Este documento define cómo versionamos ELA BEAUTY: convención de commits, cuándo subir de
versión, cómo se etiqueta un release y el flujo de ramas. El objetivo es que el historial de
Git y el `CHANGELOG.md` cuenten la misma historia sin esfuerzo extra.

## 1. Convención de commits

El repositorio ya sigue [Conventional Commits](https://www.conventionalcommits.org/es/) de
facto — este documento formaliza esa convención para que se mantenga consistente.

```
<tipo>(<scope opcional>): <descripción en imperativo, minúsculas>
```

### Tipos usados en este proyecto

| Tipo       | Cuándo usarlo                                                            |
|------------|---------------------------------------------------------------------------|
| `feat`     | Nueva funcionalidad visible para el usuario o la API                     |
| `fix`      | Corrección de un bug                                                     |
| `docs`     | Cambios solo de documentación (README, docs/, comentarios extensos)      |
| `style`    | Cambios de estilo/UI que no alteran lógica (CSS, formato, textos)        |
| `refactor` | Cambio de código que no agrega funcionalidad ni corrige un bug           |
| `chore`    | Tareas de mantenimiento (dependencias, configuración, tooling)           |
| `perf`     | Mejora de rendimiento                                                    |
| `test`     | Agregar o corregir tests                                                 |

### Scope

El scope identifica el área afectada y ayuda a leer el historial de un vistazo. Ejemplos ya
usados en el repo: `auth`, `admin`, `checkout`, `i18n`, `ui`, `security`, `db`, `vercel`.
Se pueden combinar cuando el cambio toca varias áreas relacionadas: `fix(auth/i18n)`.

### Ejemplos reales del historial

```
feat(checkout): complete functional checkout process and improve search results UI
fix(auth): ensure JSON error responses and fix face-api model paths for i18n
style(ui): improve UI/UX for cart, favorites and profile pages with better translations
docs: add security improvements implementation plan
chore: install throttler, helmet, cookie-parser for security hardening
```

## 2. Versionado semántico (SemVer)

Formato `MAJOR.MINOR.PATCH` (ej. `1.4.2`), aplicado tanto al backend (`package.json` raíz)
como al frontend (`frontend/package.json`) — ambos se versionan juntos como un solo producto.

- **MAJOR** (`X.0.0`): cambios que rompen compatibilidad — contratos de API existentes,
  variables de entorno requeridas, o cambios de infraestructura que exigen migración manual.
- **MINOR** (`0.X.0`): nueva funcionalidad retrocompatible. La mayoría de los `feat` caen aquí
  (nuevo módulo, nuevo endpoint, nueva página).
- **PATCH** (`0.0.X`): correcciones de bugs, ajustes de seguridad o de estilo que no agregan
  funcionalidad ni rompen nada (`fix`, `style`, `chore` relevantes para producción).

Mientras el proyecto esté en `0.y.z`, se asume API en desarrollo activo: un `MINOR` puede
incluir cambios menores incompatibles si se documentan claramente en el CHANGELOG.

## 3. Mantener el CHANGELOG

- Todo cambio con impacto para quien despliega o usa la app (no solo tooling interno) se
  agrega a la sección `[Unreleased]` de `CHANGELOG.md` en el mismo PR que lo introduce,
  bajo `Added` / `Changed` / `Fixed` / `Security` según corresponda.
- Al cortar una versión: renombrar `[Unreleased]` a `[X.Y.Z] - YYYY-MM-DD`, dejar una nueva
  sección `[Unreleased]` vacía arriba, y actualizar los enlaces de comparación al final del
  archivo.

## 4. Tags de release

Cuando el estado de `main` se considera un release:

```bash
# 1. Actualizar CHANGELOG.md (mover Unreleased -> [X.Y.Z] - fecha)
# 2. Alinear versión en package.json (raíz) y frontend/package.json
npm version X.Y.Z --no-git-tag-version
cd frontend && npm version X.Y.Z --no-git-tag-version && cd ..

# 3. Commit y tag
git add package.json frontend/package.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --tags
```

El despliegue de backend en **Koyeb** se dispara sobre `main`; el tag queda como referencia
histórica del estado exacto de código que corresponde a esa versión en producción.

## 5. Flujo de ramas

- `main`: siempre desplegable. El backend en Koyeb y el frontend en Vercel se construyen desde
  aquí.
- Ramas de feature: `feat/<descripcion-corta>`, `fix/<descripcion-corta>`, etc., creadas desde
  `main` y fusionadas vía Pull Request.
- El título del PR debe seguir la misma convención que los commits (`feat(scope): ...`), ya
  que sirve de resumen rápido en el historial de PRs de GitHub.
- Se prefiere *squash merge* cuando la rama tiene commits intermedios ruidosos ("wip", "fix
  typo"), y merge normal cuando cada commit ya es atómico y legible por sí solo.

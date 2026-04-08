# ELA Beauty - Manual de Funcionalidades

## Indice

1. [Arquitectura General](#1-arquitectura-general)
2. [Autenticacion y Registro](#2-autenticacion-y-registro)
3. [Navegacion y Busqueda de Productos](#3-navegacion-y-busqueda-de-productos)
4. [Carrito de Compras](#4-carrito-de-compras)
5. [Favoritos](#5-favoritos)
6. [Catalogo de Peinados](#6-catalogo-de-peinados)
7. [Catalogo de Disenos de Unas](#7-catalogo-de-disenos-de-unas)
8. [Catalogo de Servicios](#8-catalogo-de-servicios)
9. [Perfil de Usuario](#9-perfil-de-usuario)
10. [Panel de Administracion](#10-panel-de-administracion)
11. [Sistema de Notificaciones en Tiempo Real](#11-sistema-de-notificaciones-en-tiempo-real)
12. [Temas Visuales](#12-temas-visuales)
13. [Modulos Pendientes de Implementacion](#13-modulos-pendientes-de-implementacion)

---

## 1. Arquitectura General

### Stack Tecnologico

| Capa | Tecnologia | Funcion |
|------|-----------|---------|
| Frontend | Angular 17+ (Standalone Components) | Interfaz de usuario SPA |
| Backend | NestJS (Node.js) | API REST |
| Base de Datos | PostgreSQL (Supabase) | Almacenamiento persistente |
| ORM | TypeORM | Mapeo objeto-relacional |
| Autenticacion | JWT (HttpOnly Cookies) | Sesiones seguras |
| Tiempo Real | Server-Sent Events (SSE) | Actualizaciones en vivo |
| Validacion | class-validator + Angular Reactive Forms | Validacion en ambos lados |

### Flujo General de Comunicacion

```
Usuario (Navegador)
    |
    v
Frontend Angular (Vercel)
    |  (HTTP con cookies)
    v
Backend NestJS (Koyeb)
    |  (TypeORM)
    v
PostgreSQL (Supabase)
```

El frontend se comunica con el backend mediante peticiones HTTP. La autenticacion se maneja con cookies HttpOnly (el token JWT nunca esta expuesto al JavaScript del navegador). El backend valida cada peticion y consulta la base de datos.

---

## 2. Autenticacion y Registro

### 2.1 Registro de Usuario

**Ruta:** `/auth/register`

**Paso a paso:**

1. El usuario accede a la pagina de registro.
2. Completa el formulario con los siguientes campos:
   - **Nombre** (obligatorio)
   - **Apellido Paterno** (obligatorio)
   - **Apellido Materno** (obligatorio)
   - **Correo electronico** (obligatorio, formato valido)
   - **Contrasena** (minimo 8 caracteres, al menos 1 mayuscula, 1 minuscula y 1 numero)
   - **Confirmar contrasena** (debe coincidir)
3. El formulario muestra en tiempo real un indicador de fortaleza de la contrasena con los requisitos que se van cumpliendo.
4. Al enviar, se ejecuta una verificacion invisible de reCAPTCHA v3.
5. El backend recibe los datos, verifica que el correo no este registrado y crea la cuenta con estado **inactivo** y **no verificado**.
6. Se crea un "usuario sombra" en Supabase Auth, que envia un correo de verificacion con un codigo OTP.
7. Si la creacion en Supabase falla, el usuario creado en la base de datos local se elimina automaticamente (rollback).
8. Se muestra un mensaje indicando que debe verificar su correo electronico.

### 2.2 Verificacion de Correo

**Ruta:** `/auth/verificar-correo`

**Paso a paso:**

1. El usuario recibe un correo con un enlace que contiene un `token_hash`.
2. Al hacer clic, el frontend extrae el token del parametro de la URL.
3. El token se envia al backend, que lo valida con Supabase.
4. Si es valido, Supabase retorna el correo del usuario.
5. El backend busca al usuario por correo, actualiza `isEmailVerified = true` y `isActive = true`.
6. Se muestra un mensaje de verificacion exitosa con un enlace para iniciar sesion.

**Reenvio de verificacion:** El usuario puede solicitar un reenvio del correo desde `/auth/reenviar-verificacion` (limitado a 5 solicitudes por minuto).

### 2.3 Inicio de Sesion con Contrasena

**Ruta:** `/auth/login`

**Paso a paso:**

1. El usuario ingresa su correo electronico y contrasena.
2. Se ejecuta una verificacion de reCAPTCHA v3 (no bloqueante).
3. El backend verifica:
   - Que el usuario exista en la base de datos.
   - Que la contrasena coincida (comparacion con bcrypt).
   - Que el correo este verificado.
   - Que la cuenta este activa.
4. Si todo es correcto, el backend genera dos tokens JWT:
   - **access_token** (15 minutos de duracion) - se establece como cookie HttpOnly.
   - **refresh_token** (7 dias de duracion) - se establece como cookie HttpOnly.
5. El frontend recibe los datos del usuario (sin la contrasena) y actualiza el estado de la aplicacion.
6. Si el usuario tiene rol de administrador, se redirige a `/admin`. Si es usuario normal, se redirige a la pagina principal.

**Manejo de errores:**
- Si las credenciales son invalidas, se muestra "Credenciales invalidas".
- Si se excede el limite de intentos (5 por minuto), se muestra un contador regresivo indicando cuanto tiempo debe esperar.

### 2.4 Inicio de Sesion con Passkey (WebAuthn/FIDO2)

**Paso a paso:**

1. En la pagina de login, el usuario hace clic en "Iniciar sesion con Passkey".
2. El frontend solicita las opciones de autenticacion al backend (`/auth/webauthn/login/options`).
3. El backend genera un **challenge** criptografico y lo almacena en memoria.
4. El navegador muestra el dialogo nativo de autenticacion biometrica (huella digital, Face ID, PIN de Windows Hello, etc.).
5. El usuario se autentica con su dispositivo.
6. El navegador genera una respuesta firmada con la clave privada almacenada en el dispositivo.
7. El frontend envia la respuesta al backend (`/auth/webauthn/login/verify`).
8. El backend verifica la firma usando la clave publica almacenada, valida el counter y emite los tokens JWT.
9. Se establece la sesion con cookies igual que en el login normal.

**Prerequisito:** El usuario debe haber registrado previamente un passkey desde su perfil (ver seccion 9).

### 2.5 Inicio de Sesion con Reconocimiento Facial

**Opciones disponibles:**

**A) Face + Contrasena (doble factor):**
1. El usuario ingresa correo, contrasena y activa la camara.
2. Se captura un descriptor facial (vector de 128 dimensiones) usando face-api.js.
3. El backend verifica la contrasena Y compara el descriptor facial con el almacenado.
4. Si ambos coinciden, se emiten los tokens.

**B) Solo rostro (face-only):**
1. El usuario activa la camara y captura su rostro.
2. El descriptor se envia al backend.
3. El backend compara el descriptor contra TODOS los descriptores almacenados de usuarios activos.
4. Si encuentra una coincidencia con distancia euclidiana menor al umbral (0.45), emite los tokens.

**Modelos utilizados:** TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet (cargados desde `/assets/models`).

### 2.6 Recuperacion de Contrasena

**Paso a paso:**

1. El usuario accede a `/auth/olvide-contrasena` y escribe su correo electronico.
2. El backend verifica que el usuario exista, este verificado y activo.
3. Independientemente de si existe o no, se muestra un mensaje generico: "Si el correo existe, se ha enviado un enlace de recuperacion" (para evitar enumeracion de cuentas).
4. Si el usuario existe, Supabase envia un correo con un enlace de recuperacion que contiene un `token_hash`.
5. El usuario accede a `/auth/recuperar-contrasena`, ingresa su nueva contrasena (mismas reglas de validacion que en el registro) y la confirma.
6. El backend valida el token con Supabase, hashea la nueva contrasena con bcrypt (12 rondas) y la actualiza.
7. Se redirige al login.

### 2.7 Renovacion Automatica de Sesion

- Cuando una peticion HTTP recibe un error 401 (token expirado), el interceptor de Angular automaticamente intenta renovar el access_token usando el refresh_token.
- Si la renovacion es exitosa, la peticion original se reintenta automaticamente.
- Si el refresh_token tambien ha expirado, se redirige al usuario al login.
- Las peticiones concurrentes comparten una unica solicitud de renovacion para evitar multiples llamadas.

### 2.8 Cierre de Sesion

1. El usuario hace clic en "Cerrar sesion" en el header.
2. Se envia una peticion al backend (`/auth/logout`).
3. El backend elimina las cookies `access_token` y `refresh_token`.
4. El frontend limpia el estado de la aplicacion (usuario, carrito, favoritos).
5. Se redirige a la pagina principal.

---

## 3. Navegacion y Busqueda de Productos

### 3.1 Pagina Principal (Home)

**Ruta:** `/`

La pagina de inicio presenta los siguientes elementos:

1. **Seccion Hero:** 6 tarjetas de categorias (Labiales, Ojos, Rostro, Unas, Sombras, Rubores) con iconos, conteo de productos y fondos degradados. Al hacer clic, navegan a la busqueda filtrada por esa categoria.

2. **Productos Destacados:** 3 productos resaltados con badges (BEST SELLER, NUEVO, TOP RATED), mostrando precio y descripcion.

3. **Caracteristicas de Marca:** Calidad Garantizada, Cruelty Free, Envio Express.

4. **Testimonios:** Carrusel de resenas de clientes con calificacion de 5 estrellas. Se navega entre testimonios manualmente.

5. **Informacion de contacto:** Telefono, email y horarios.

Los datos de la pagina principal son **estaticos** (hardcodeados en el servicio del backend), no provienen de la base de datos.

### 3.2 Busqueda y Filtrado de Productos

**Ruta:** `/busqueda`

**Paso a paso:**

1. El usuario puede llegar a esta pagina de varias formas:
   - Haciendo clic en una categoria desde el Home.
   - Usando la barra de busqueda en el header.
   - Navegando desde el menu (Labiales, Ojos, Rostro, Unas, Ofertas, Nuevo).

2. **Filtros disponibles:**
   - **Texto libre** (`q`): Busqueda por nombre de producto (LIKE en la base de datos).
   - **Categoria** (`category`): Filtra por categoria del producto.
   - **Rango de precio**: Precio minimo y maximo.
   - **Solo en stock**: Toggle para mostrar solo productos disponibles.
   - **Edad objetivo**: Adolescentes, Jovenes, Adultos.
   - **Ordenar por**: Fecha de creacion, precio o calificacion.
   - **Orden**: Ascendente o descendente.

3. Los filtros se reflejan en los parametros de la URL para permitir compartir busquedas.

4. **Resultados:** Se muestran en una grilla de tarjetas con:
   - Imagen del producto
   - Nombre y descripcion (truncada)
   - Precio
   - Calificacion (estrellas)
   - Categoria
   - Boton de agregar a favoritos (corazon)
   - Boton de agregar al carrito

5. **Paginacion:** 12 productos por pagina con navegacion inteligente (muestra 5 paginas a la vez con botones Anterior/Siguiente).

### 3.3 Busqueda Rapida (Autocompletado)

En el header hay una barra de busqueda con autocompletado:

1. El usuario escribe al menos 2 caracteres.
2. Despues de 300ms sin escribir (debounce), se buscan coincidencias en el backend.
3. Se muestran hasta 5 resultados con imagen, nombre y precio.
4. Al hacer clic en un resultado, se navega a la pagina de busqueda con el termino como filtro.
5. Al hacer clic fuera del dropdown, se cierra (directiva `ClickOutside`).

---

## 4. Carrito de Compras

**Ruta:** `/carrito` (requiere autenticacion)

### 4.1 Agregar al Carrito

1. Desde la pagina de busqueda o favoritos, el usuario hace clic en "Agregar al carrito".
2. Si no ha iniciado sesion, se le redirige al login.
3. Si ya ha iniciado sesion, el producto se agrega al carrito con cantidad 1.
4. Si el producto ya esta en el carrito, se incrementa la cantidad.
5. Se muestra una notificacion toast de confirmacion.
6. El icono del carrito en el header actualiza el contador de items.

### 4.2 Ver y Gestionar el Carrito

1. El usuario accede a `/carrito` (clic en el icono del carrito o navegacion directa).
2. Se muestra la lista de productos con:
   - Imagen, nombre y precio unitario.
   - Selector de cantidad (botones + y -).
   - Boton de eliminar producto individual.
3. **Calculo de precios:**
   - Subtotal por producto (precio x cantidad).
   - Envio gratuito para compras mayores a $500 MXN.
   - Cargo de envio de $50 MXN para compras menores.
   - Total final con envio incluido.
4. Boton "Vaciar carrito" (con modal de confirmacion).

### 4.3 Proceso de Checkout (Compra)

El checkout se realiza mediante un modal de multiples pasos:

**Paso 1 - Direccion de envio:**
- Nombre y apellido
- Calle
- Colonia
- Ciudad, Estado, Codigo postal
- Numero de telefono
- Todos los campos son obligatorios.

**Paso 2 - Metodo de pago:**
- Opciones: Tarjeta de credito/debito, Pago en tienda, OXXO.
- Si selecciona tarjeta:
  - Numero de tarjeta (16 digitos, auto-formateado con espacios).
  - Nombre del titular.
  - Fecha de vencimiento (MM/AA, auto-formateado).
  - CVV (3-4 digitos).

**Paso 3 - Revision del pedido:**
- Resumen de productos, cantidades y precios.
- Direccion de envio confirmada.
- Metodo de pago (numero de tarjeta enmascarado: `**** **** **** XXXX`).
- Total final desglosado.

**Paso 4 - Confirmacion:**
- Se genera un numero de orden: `ELA-XXXXXX` (6 digitos aleatorios).
- Se muestra un mensaje de confirmacion.
- El carrito se vacia automaticamente.

> **Nota:** El checkout es una simulacion en el frontend. No hay procesamiento real de pagos ni integracion con pasarelas de pago.

### 4.4 Persistencia del Carrito

- El carrito se almacena en la base de datos (tabla `cart` y `cart_items`).
- Cada usuario tiene un unico carrito (relacion 1-a-1).
- Los items del carrito se eliminan en cascada si se elimina el usuario o el producto.
- El carrito se carga automaticamente al iniciar sesion.

---

## 5. Favoritos

**Ruta:** `/favoritos` (requiere autenticacion)

### 5.1 Agregar/Quitar Favoritos

1. En cualquier tarjeta de producto (busqueda, favoritos), el usuario hace clic en el icono de corazon.
2. Si el producto no esta en favoritos, se agrega. Si ya esta, se elimina (toggle).
3. Se muestra una notificacion toast.
4. El icono del corazon en el header actualiza el contador.

### 5.2 Ver Favoritos

1. El usuario accede a `/favoritos`.
2. Se muestra una grilla con los productos guardados.
3. Cada tarjeta tiene:
   - Imagen, nombre, descripcion (truncada), precio, calificacion.
   - Boton de eliminar de favoritos (icono de basura).
   - Boton de agregar al carrito.

### 5.3 Persistencia

- Los favoritos se almacenan en la base de datos (tabla `favorites`).
- Restriccion unica: un usuario no puede tener el mismo producto dos veces en favoritos.
- Se eliminan en cascada si se elimina el usuario o el producto.

---

## 6. Catalogo de Peinados

**Ruta:** `/peinados`

### Paso a paso:

1. El usuario accede al catalogo de peinados desde el menu de navegacion.
2. Se muestran todos los peinados disponibles en tarjetas.
3. **Filtro por categoria:** Botones para filtrar por Corte, Color, Peinado, Tratamiento. Se puede activar/desactivar cada filtro.
4. Cada tarjeta muestra:
   - Nombre del peinado
   - Descripcion
   - Duracion estimada
   - Precio
   - Imagen
5. Al hacer clic en una tarjeta, se expande para mostrar los **pasos del proceso** (separados por lineas).
6. **Actualizaciones en tiempo real:** Si un administrador modifica peinados, el catalogo se actualiza automaticamente via Server-Sent Events.

---

## 7. Catalogo de Disenos de Unas

**Ruta:** `/disenos-unas`

### Funcionamiento:

Identico al catalogo de peinados, pero con las siguientes diferencias:
- **Filtro por estilo:** Esmalte Semipermanente, Acrilico, Gel, Nail Art.
- Los eventos de actualizacion escuchan `nail-designs:updated`.

---

## 8. Catalogo de Servicios

Los servicios (faciales, corporales, spa, masajes, manicure, pedicure) se muestran como parte del contenido de la pagina principal y se gestionan desde el panel de administracion.

**Categorias disponibles:** facial, corporal, spa, masajes, manicure, pedicure.

Cada servicio tiene: nombre, descripcion, precio (decimal), duracion (en minutos), categoria, imagen y estado (activo/inactivo).

---

## 9. Perfil de Usuario

**Ruta:** `/perfil` (requiere autenticacion)

### 9.1 Edicion de Datos Personales

1. El usuario accede a su perfil.
2. Se muestra un formulario con:
   - Nombre (editable)
   - Apellido Paterno (editable)
   - Apellido Materno (editable)
   - Correo electronico (solo lectura)
3. El usuario modifica los campos deseados y hace clic en "Guardar".
4. Se envia la actualizacion al backend y se muestra un toast de confirmacion.

### 9.2 Registro de Passkey (WebAuthn)

1. En la seccion de biometria del perfil, el usuario hace clic en "Registrar Passkey".
2. El frontend solicita opciones de registro al backend.
3. El backend genera un challenge y opciones de creacion de credencial.
4. El navegador muestra el dialogo nativo para crear la credencial (huella, Face ID, PIN, etc.).
5. El usuario se autentica con su dispositivo.
6. El navegador genera un par de claves (publica/privada). La clave privada queda en el dispositivo; la publica se envia al backend.
7. El backend almacena la credencial publica, el ID de credencial y el counter en la base de datos.
8. Se muestra un mensaje de exito.

### 9.3 Registro de Rostro

1. En la seccion de biometria, el usuario hace clic en "Registrar Rostro".
2. Se cargan los modelos de face-api.js (TinyFaceDetector, Landmarks, Recognition).
3. Se solicita permiso para acceder a la camara.
4. El usuario posiciona su rostro frente a la camara.
5. Se captura un **descriptor facial** (un vector de 128 numeros que representan las caracteristicas del rostro). **No se almacena ninguna foto.**
6. El descriptor se envia al backend y se almacena como JSON en la base de datos.
7. Se muestra un mensaje de exito y se detiene la camara.

---

## 10. Panel de Administracion

**Ruta base:** `/admin` (requiere autenticacion + rol admin)

### 10.1 Acceso al Panel

- Solo los usuarios con rol `admin` pueden acceder.
- El guard `adminGuard` verifica la sesion y el rol antes de cargar las rutas.
- El layout tiene un sidebar de navegacion con las secciones disponibles.

### 10.2 Dashboard

**Ruta:** `/admin`

Muestra tarjetas con estadisticas:
- Total de productos
- Total de peinados
- Total de disenos de unas
- Total de servicios
- Total de usuarios

Ademas, muestra una tabla con los 5 usuarios mas recientes (email, rol, fecha de creacion).

### 10.3 Gestion de Productos

**Ruta:** `/admin/productos`

**Operaciones CRUD:**

1. **Listar:** Tabla paginada (20 items por pagina) con nombre, descripcion, precio, categoria, estado. Toggle para mostrar/ocultar productos inactivos.

2. **Crear:** Boton "Crear Nuevo" abre un modal con formulario:
   - Nombre, Descripcion (obligatorios)
   - Precio (obligatorio, minimo 0)
   - Categoria, Subcategoria
   - Stock (obligatorio, minimo 0)
   - URL de imagen
   - Calificacion (0-5)
   - Edad objetivo

3. **Editar:** Clic en la fila abre el modal con los datos precargados. Se modifica y guarda.

4. **Desactivar:** Boton que cambia el estado a inactivo (soft delete). El producto deja de mostrarse en el catalogo publico pero se mantiene en la base de datos.

5. **Restaurar:** Boton para reactivar un producto desactivado.

6. **Eliminar permanentemente:** Solo disponible para productos inactivos. Requiere confirmacion via modal. Elimina el registro de la base de datos.

**Despues de cada operacion:** Se emite un evento SSE `products:updated` que hace que todas las paginas publicas que muestran productos se actualicen automaticamente.

### 10.4 Gestion de Peinados

**Ruta:** `/admin/peinados`

Misma estructura CRUD que productos con campos especificos:
- Nombre, Descripcion, Proceso (pasos separados por lineas) - obligatorios
- Duracion, Precio, Categoria, URL de imagen - opcionales

Emite evento: `hairstyles:updated`

### 10.5 Gestion de Disenos de Unas

**Ruta:** `/admin/unas`

Misma estructura CRUD que peinados, con "Estilo" en lugar de "Categoria".

Emite evento: `nail-designs:updated`

### 10.6 Gestion de Servicios

**Ruta:** `/admin/servicios`

Campos del formulario:
- Nombre, Descripcion (obligatorios)
- Precio (obligatorio, minimo 0)
- Duracion en minutos (obligatorio, minimo 1)
- Categoria (obligatorio): facial, corporal, spa, masajes, manicure, pedicure
- URL de imagen (opcional)

Emite evento: `services:updated`

### 10.7 Gestion de Usuarios

**Ruta:** `/admin/usuarios`

1. **Listar:** Tabla paginada con nombre, email, rol, estado, acciones.

2. **Cambiar rol:** Modal con dropdown para seleccionar entre `user` y `admin`. Validacion: solo se permiten esos dos valores.

3. **Desactivar:** Soft delete del usuario. **Proteccion:** No se puede desactivar al ultimo administrador activo del sistema.

4. **Restaurar:** Reactivar usuario desactivado.

5. **Eliminar permanentemente:** Solo disponible para usuarios inactivos y que no sean administradores. Requiere confirmacion.

### 10.8 Seed de Administrador Inicial

**Endpoint:** `POST /admin/seed-admin`

- Crea el primer administrador del sistema con credenciales predefinidas.
- Solo funciona si no existe ningun administrador en la base de datos.
- Credenciales por defecto: `admin@elabeauty.com` / `Admin@Ela2026`.
- Este endpoint **no requiere autenticacion** (es para el primer arranque del sistema).

---

## 11. Sistema de Notificaciones en Tiempo Real

### 11.1 Server-Sent Events (SSE)

El sistema utiliza SSE para enviar actualizaciones en tiempo real del backend al frontend:

1. Al cargar cualquier pagina publica con catalogos, el frontend establece una conexion SSE con `/events/stream`.
2. El backend mantiene la conexion abierta y envia eventos cuando un administrador realiza cambios.
3. **Eventos soportados:**
   - `products:updated` - Actualiza el catalogo de productos
   - `hairstyles:updated` - Actualiza el catalogo de peinados
   - `nail-designs:updated` - Actualiza el catalogo de disenos de unas
   - `services:updated` - Actualiza el catalogo de servicios
4. El frontend recibe el evento y recarga los datos automaticamente.
5. Si la conexion se pierde, se reconecta automaticamente despues de 30 segundos.

### 11.2 Notificaciones Toast

El sistema de notificaciones muestra mensajes temporales en la esquina inferior derecha:

- **Exito (verde):** Operacion completada correctamente.
- **Error (rojo):** Algo salio mal.
- **Advertencia (naranja):** Atencion requerida.
- **Informacion (azul):** Datos informativos.

Cada toast se cierra automaticamente despues de 4 segundos o al hacer clic en el boton de cerrar.

### 11.3 Modales de Confirmacion

Para acciones destructivas (eliminar producto, vaciar carrito, etc.), se muestra un modal centrado con:
- Titulo y mensaje descriptivo
- Botones de confirmar y cancelar (personalizables)
- Modo de peligro (boton rojo con icono de advertencia)
- Se cierra al hacer clic fuera o presionar Escape

---

## 12. Temas Visuales

La aplicacion soporta 3 temas visuales:

1. **Claro (light):** Tema por defecto con fondo blanco.
2. **Oscuro (dark):** Fondo oscuro para reducir fatiga visual.
3. **Daltonismo (colorblind):** Paleta de colores adaptada para personas con daltonismo.

**Funcionamiento:**
- El tema se selecciona desde un dropdown en el header o en el panel de administracion.
- La preferencia se guarda en `localStorage` y persiste entre sesiones.
- Se aplica mediante un atributo CSS `data-theme` en el elemento raiz del DOM.

---

## 13. Modulos Pendientes de Implementacion

Los siguientes modulos estan registrados en la aplicacion pero **no tienen funcionalidad implementada** (son modulos vacios):

| Modulo | Descripcion esperada |
|--------|---------------------|
| **Appointments** | Reserva de citas para servicios del salon |
| **Blog** | Articulos y consejos de belleza |
| **Contacts** | Formulario de contacto |
| **Gallery** | Galeria de fotos del salon y trabajos realizados |

Estos modulos estan importados en `app.module.ts` pero no contienen controladores, servicios ni entidades.

---

## Resumen de Endpoints de la API

### Publicos (sin autenticacion)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/home` | Datos de la pagina principal |
| GET | `/home/services-preview` | Vista previa de servicios |
| GET | `/products/search` | Buscar productos con filtros |
| GET | `/products/categories` | Listar categorias |
| GET | `/products/featured` | Productos destacados |
| GET | `/products/:id` | Detalle de un producto |
| GET | `/hairstyles` | Listar peinados |
| GET | `/hairstyles/:id` | Detalle de un peinado |
| GET | `/nail-designs` | Listar disenos de unas |
| GET | `/nail-designs/:id` | Detalle de un diseno |
| GET | `/services` | Listar servicios activos |
| GET | `/events/stream` | Stream SSE de eventos |

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesion |
| POST | `/auth/logout` | Cerrar sesion |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/profile` | Obtener perfil del usuario |
| PATCH | `/auth/profile/update` | Actualizar perfil |
| POST | `/auth/verificar-correo` | Verificar email |
| POST | `/auth/reenviar-verificacion` | Reenviar email de verificacion |
| POST | `/auth/olvide-contrasena` | Solicitar restablecimiento |
| POST | `/auth/nueva-contrasena` | Establecer nueva contrasena |
| POST | `/auth/webauthn/register/options` | Opciones de registro WebAuthn |
| POST | `/auth/webauthn/register/verify` | Verificar registro WebAuthn |
| POST | `/auth/webauthn/login/options` | Opciones de login WebAuthn |
| POST | `/auth/webauthn/login/verify` | Verificar login WebAuthn |
| POST | `/auth/face/save` | Guardar descriptor facial |
| POST | `/auth/login/face` | Login con rostro + contrasena |
| POST | `/auth/login/face-only` | Login solo con rostro |

### Usuario Autenticado

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/cart` | Obtener carrito |
| POST | `/cart/items` | Agregar item al carrito |
| PATCH | `/cart/items/:productId` | Actualizar cantidad |
| DELETE | `/cart/items/:productId` | Eliminar item |
| DELETE | `/cart` | Vaciar carrito |
| GET | `/favorites` | Listar favoritos |
| POST | `/favorites/:productId` | Agregar a favoritos |
| DELETE | `/favorites/:productId` | Quitar de favoritos |

### Administrador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/admin/seed-admin` | Crear admin inicial |
| GET | `/admin/products` | Listar productos (paginado) |
| POST | `/admin/products` | Crear producto |
| PATCH | `/admin/products/:id` | Actualizar producto |
| PATCH | `/admin/products/:id/deactivate` | Desactivar producto |
| PATCH | `/admin/products/:id/restore` | Restaurar producto |
| DELETE | `/admin/products/:id` | Eliminar producto |
| GET/POST/PATCH/DELETE | `/admin/hairstyles/*` | CRUD de peinados |
| GET/POST/PATCH/DELETE | `/admin/nail-designs/*` | CRUD de disenos de unas |
| GET/POST/PATCH/DELETE | `/admin/services/*` | CRUD de servicios |
| GET | `/admin/users` | Listar usuarios |
| PATCH | `/admin/users/:id/role` | Cambiar rol |
| PATCH | `/admin/users/:id/deactivate` | Desactivar usuario |
| PATCH | `/admin/users/:id/restore` | Restaurar usuario |
| DELETE | `/admin/users/:id` | Eliminar usuario |

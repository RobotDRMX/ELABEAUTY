# ELA Beauty - Analisis de Seguridad

## Indice

1. [Credenciales Expuestas en el Repositorio](#1-credenciales-expuestas-en-el-repositorio)
2. [Endpoint de Seed de Administrador sin Proteccion](#2-endpoint-de-seed-de-administrador-sin-proteccion)
3. [Configuracion CORS Permisiva con Regex](#3-configuracion-cors-permisiva-con-regex)
4. [Ausencia de Proteccion CSRF](#4-ausencia-de-proteccion-csrf)
5. [WebAuthn Hardcodeado para Localhost](#5-webauthn-hardcodeado-para-localhost)
6. [Descriptores Faciales sin Cifrar](#6-descriptores-faciales-sin-cifrar)
7. [Login Facial Escanea Todos los Usuarios](#7-login-facial-escanea-todos-los-usuarios)
8. [Challenge Store en Memoria sin Expiracion](#8-challenge-store-en-memoria-sin-expiracion)
9. [Synchronize Habilitado en Base de Datos](#9-synchronize-habilitado-en-base-de-datos)
10. [Refresh Token sin Rotacion](#10-refresh-token-sin-rotacion)
11. [Validacion SSL Deshabilitada](#11-validacion-ssl-deshabilitada)
12. [Carrito y Favoritos sin Validacion de Entrada](#12-carrito-y-favoritos-sin-validacion-de-entrada)
13. [Endpoint SSE sin Autenticacion](#13-endpoint-sse-sin-autenticacion)
14. [reCAPTCHA No Bloqueante](#14-recaptcha-no-bloqueante)
15. [Ausencia de Bloqueo de Cuenta por Intentos Fallidos](#15-ausencia-de-bloqueo-de-cuenta-por-intentos-fallidos)

---

## 1. Credenciales Expuestas en el Repositorio

### Descripcion del problema

El archivo `.env` del proyecto contiene credenciales sensibles que han sido commiteadas al repositorio Git. Estas incluyen:

- Contrasena de la base de datos PostgreSQL (`DB_PASSWORD`)
- Secreto JWT para firmar tokens (`JWT_SECRET`)
- Clave secreta de reCAPTCHA (`RECAPTCHA_SECRET_KEY`)
- Service Role Key de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) que otorga acceso completo a la base de datos y al sistema de autenticacion de Supabase
- URL del proyecto Supabase (`SUPABASE_URL`)

**Ubicacion:** Archivo `.env` en la raiz del proyecto.

### Por que es un problema

Cualquier persona con acceso al repositorio (o al historial de Git, incluso si el archivo se elimina posteriormente) puede obtener estas credenciales y:

- Conectarse directamente a la base de datos y leer, modificar o eliminar toda la informacion.
- Firmar tokens JWT validos y suplantar a cualquier usuario, incluyendo administradores.
- Usar la Service Role Key de Supabase para crear/eliminar usuarios de autenticacion, leer datos de cualquier tabla sin restricciones RLS (Row Level Security), y modificar el esquema de la base de datos.
- Deshabilitar la proteccion reCAPTCHA al conocer la clave secreta.

Este es el problema de seguridad mas critico de la aplicacion porque compromete completamente la integridad del sistema.

### Solucion 1: Rotacion inmediata y gestion de secretos

1. **Rotar todas las credenciales inmediatamente:**
   - Generar una nueva contrasena para la base de datos PostgreSQL desde el panel de Supabase.
   - Generar un nuevo `JWT_SECRET` (al menos 64 bytes aleatorios en hexadecimal).
   - Revocar y regenerar la Service Role Key de Supabase.
   - Revocar y regenerar las claves de reCAPTCHA desde la consola de Google.

2. **Eliminar el archivo del historial de Git** usando `git filter-branch` o la herramienta BFG Repo Cleaner para purgar el `.env` de todos los commits anteriores.

3. **Inyectar las variables de entorno a traves de la plataforma de despliegue** (Vercel para el frontend, Koyeb para el backend), sin que jamas aparezcan en el codigo fuente.

### Solucion 2: Usar un gestor de secretos

1. **Integrar un gestor de secretos** como AWS Secrets Manager, HashiCorp Vault, o la funcionalidad nativa de secretos de la plataforma de hosting.

2. **Configurar el backend para leer los secretos en tiempo de ejecucion** desde el gestor, en lugar de leerlos desde archivos `.env`.

3. **Implementar rotacion automatica** de credenciales con el gestor de secretos, de forma que las claves se renueven periodicamente sin intervencion manual.

---

## 2. Endpoint de Seed de Administrador sin Proteccion

### Descripcion del problema

El endpoint `POST /admin/seed-admin` crea el primer usuario administrador del sistema. Este endpoint:

- **No requiere autenticacion** de ningun tipo.
- Tiene una contrasena por defecto hardcodeada en el codigo fuente: `Admin@Ela2026`.
- No tiene rate limiting especifico (solo el global de 100 peticiones/minuto).

**Ubicacion:** `src/admin/admin.controller.ts` (endpoint) y `src/admin/admin.service.ts` (logica con contrasena hardcodeada en linea 26).

### Por que es un problema

En un escenario de produccion, cualquier persona que conozca la URL de la API puede llamar a este endpoint. Si la base de datos esta vacia (por ejemplo, despues de un despliegue nuevo o una migracion), el atacante puede crear la cuenta de administrador antes que el propietario legitimo, obteniendo control total del sistema. Ademas, como la contrasena esta en el codigo fuente, cualquiera con acceso al repositorio conoce las credenciales del administrador inicial.

### Solucion 1: Proteger el endpoint con una clave de entorno

1. Crear una variable de entorno `ADMIN_SEED_SECRET` con un valor secreto aleatorio.
2. Modificar el endpoint para que requiera esta clave en el header o body de la peticion:
   ```typescript
   @Post('seed-admin')
   seedAdmin(@Body('secret') secret: string) {
     if (secret !== this.configService.get('ADMIN_SEED_SECRET')) {
       throw new ForbiddenException('Clave de seed invalida');
     }
     return this.adminService.seedAdmin();
   }
   ```
3. Agregar un decorador `@Throttle({ global: { limit: 1, ttl: 3600000 } })` para limitar a 1 llamada por hora.
4. Leer la contrasena del administrador inicial desde una variable de entorno en lugar de tenerla hardcodeada.

### Solucion 2: Eliminar el endpoint y usar migraciones

1. Eliminar completamente el endpoint `seed-admin` del controlador.
2. Crear un script de migracion o un comando CLI que se ejecute manualmente:
   ```bash
   npm run seed:admin -- --email=admin@elabeauty.com --password=MiContraseñaSegura123
   ```
3. Este script solo se ejecutaria desde la terminal del servidor (no expuesto a internet), requeriria parametros explicitos y generaria una contrasena temporal que el administrador deberia cambiar en su primer inicio de sesion.

---

## 3. Configuracion CORS Permisiva con Regex

### Descripcion del problema

La configuracion CORS en `main.ts` (lineas 33-50) utiliza expresiones regulares para permitir origenes:

```typescript
if (!origin || allowed.includes(origin) ||
    /\.vercel\.app$/.test(origin) ||
    /\.koyeb\.app$/.test(origin)) {
  callback(null, true);
}
```

Los patrones `/\.vercel\.app$/` y `/\.koyeb\.app$/` aceptan **cualquier** subdominio de Vercel y Koyeb respectivamente. Ademas, `!origin` permite peticiones sin header Origin.

**Ubicacion:** `src/main.ts`, lineas 33-50.

### Por que es un problema

Un atacante puede crear una aplicacion gratuita en Vercel (por ejemplo, `sitio-malicioso.vercel.app`) y desde ahi hacer peticiones al backend de ELA Beauty. Como el dominio termina en `.vercel.app`, el backend acepta la peticion y envia las cookies de sesion. Esto permite:

- Robar sesiones de usuarios que visiten el sitio malicioso.
- Realizar acciones en nombre de usuarios autenticados (CSRF).
- Extraer datos privados del backend.

La aceptacion de peticiones sin Origin (`!origin`) es necesaria para clientes no-navegador pero debilita la proteccion.

### Solucion 1: Lista blanca de origenes exactos

1. Definir los origenes permitidos en una variable de entorno separada por comas:
   ```
   ALLOWED_ORIGINS=https://ela-beauty.vercel.app,https://ela-beauty-preview.vercel.app,http://localhost:4200
   ```
2. Modificar la configuracion CORS para usar solo coincidencias exactas:
   ```typescript
   const allowedOrigins = configService.get('ALLOWED_ORIGINS').split(',');
   origin: (origin, callback) => {
     if (!origin || allowedOrigins.includes(origin)) {
       callback(null, true);
     } else {
       callback(new Error('Not allowed by CORS'));
     }
   }
   ```
3. Eliminar completamente los patrones regex.

### Solucion 2: Validacion con patron especifico del proyecto

1. Si se necesita soportar previews de Vercel, usar un patron que incluya el nombre del proyecto:
   ```typescript
   const isAllowedPreview = /^https:\/\/ela-beauty(-[a-z0-9]+)?\.vercel\.app$/.test(origin);
   ```
   Este patron solo acepta subdominios que comiencen con `ela-beauty`, rechazando `sitio-malicioso.vercel.app`.

2. Para el entorno de desarrollo, mantener `http://localhost:4200` como origen explicito, no como regex.

---

## 4. Ausencia de Proteccion CSRF

### Descripcion del problema

La aplicacion utiliza cookies HttpOnly para almacenar los tokens JWT de autenticacion. Sin embargo, en produccion las cookies se configuran con `SameSite=None` (necesario porque el frontend y el backend estan en dominios diferentes). No existe ningun mecanismo de proteccion CSRF (tokens CSRF, double-submit cookies, etc.).

**Ubicacion:** `src/auth/auth.module.ts`, lineas 550-559 (configuracion de cookies).

### Por que es un problema

Con `SameSite=None`, el navegador envia las cookies de ELA Beauty en peticiones originadas desde cualquier sitio web. Un atacante puede crear una pagina web con un formulario oculto que envie peticiones POST al backend de ELA Beauty. Si un usuario autenticado visita esa pagina, el navegador incluye automaticamente las cookies de sesion, permitiendo al atacante:

- Agregar/eliminar productos del carrito del usuario.
- Modificar el perfil del usuario.
- Ejecutar cualquier accion que el usuario pueda realizar.
- Si el usuario es administrador, crear/eliminar productos, cambiar roles de usuarios, etc.

### Solucion 1: Implementar tokens CSRF (Double-Submit Cookie)

1. Crear un endpoint `/auth/csrf-token` que genere un token CSRF aleatorio y lo devuelva tanto en una cookie (no-HttpOnly, para que JavaScript pueda leerlo) como en el body de la respuesta.
2. En el frontend, el interceptor de Angular lee el token de la cookie y lo incluye en el header `X-CSRF-Token` de cada peticion POST/PATCH/DELETE.
3. En el backend, un middleware verifica que el header `X-CSRF-Token` coincida con el valor de la cookie CSRF en cada peticion que modifica estado.
4. Los tokens CSRF se regeneran periodicamente y al cambiar de sesion.

### Solucion 2: Migrar a autenticacion por header Authorization

1. En lugar de enviar el JWT en cookies, almacenar el access_token en memoria (una variable JavaScript, no en localStorage) y enviarlo en el header `Authorization: Bearer <token>`.
2. Solo mantener el refresh_token en una cookie HttpOnly.
3. De esta forma, las peticiones cross-site no incluyen automaticamente el token de acceso, eliminando el riesgo de CSRF.
4. Esta solucion requiere modificar el interceptor de Angular y la estrategia JWT del backend, pero elimina la necesidad de SameSite=None para las cookies de acceso.

---

## 5. WebAuthn Hardcodeado para Localhost

### Descripcion del problema

El servicio WebAuthn tiene valores de configuracion hardcodeados que solo funcionan en desarrollo:

```typescript
private readonly rpName = 'ELA Beauty';
private readonly rpID   = 'localhost';
private readonly origin = 'http://localhost:4200';
```

**Ubicacion:** `src/auth/webauthn.service.ts`, lineas 32-34.

### Por que es un problema

WebAuthn (FIDO2) es un estandar de seguridad basado en origenes. Las credenciales (passkeys) estan vinculadas criptograficamente al dominio (`rpID`) y al origen donde se registraron. Esto significa que:

- Las credenciales registradas en `localhost` no funcionaran cuando la aplicacion se despliegue en produccion (por ejemplo, `ela-beauty.vercel.app`).
- El proceso de verificacion fallara porque el origen de la peticion no coincidira con `http://localhost:4200`.
- Los usuarios que registren passkeys en desarrollo no podran usarlos en produccion, y viceversa.
- En produccion, la verificacion de autenticacion WebAuthn simplemente no funciona, dejando esta funcionalidad inutilizable.

### Solucion 1: Usar ConfigService para valores dinamicos

1. Definir las variables de entorno:
   ```
   WEBAUTHN_RP_ID=ela-beauty.vercel.app
   WEBAUTHN_ORIGIN=https://ela-beauty.vercel.app
   WEBAUTHN_RP_NAME=ELA Beauty
   ```
2. Inyectar `ConfigService` en `WebAuthnService` y leer los valores dinamicamente:
   ```typescript
   constructor(private config: ConfigService) {
     this.rpID = config.get('WEBAUTHN_RP_ID', 'localhost');
     this.origin = config.get('WEBAUTHN_ORIGIN', 'http://localhost:4200');
     this.rpName = config.get('WEBAUTHN_RP_NAME', 'ELA Beauty');
   }
   ```

### Solucion 2: Deteccion automatica del dominio

1. Modificar el servicio para detectar automaticamente el dominio basandose en la variable `NODE_ENV` y la URL del frontend:
   ```typescript
   private getRpConfig() {
     const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:4200');
     const url = new URL(frontendUrl);
     return {
       rpID: url.hostname,
       origin: url.origin,
       rpName: 'ELA Beauty',
     };
   }
   ```
2. Esto garantiza que la configuracion siempre coincida con el dominio real del frontend, sin necesidad de variables de entorno adicionales.

---

## 6. Descriptores Faciales sin Cifrar

### Descripcion del problema

Los descriptores faciales (vectores de 128 numeros de punto flotante que representan las caracteristicas biometricas del rostro de un usuario) se almacenan como texto plano (JSON) en la base de datos.

```typescript
await this.userRepo.update(userId, {
  faceDescriptor: JSON.stringify(descriptor)
});
```

**Ubicacion:** `src/auth/face.service.ts`, linea 21.

### Por que es un problema

Los datos biometricos son **irrevocables**: a diferencia de una contrasena, un usuario no puede cambiar su rostro. Si la base de datos se ve comprometida:

- Los descriptores faciales pueden usarse para suplantar la identidad de los usuarios mediante ataques de replay (enviar directamente el descriptor robado al endpoint de login facial).
- Los descriptores podrian usarse potencialmente para rastrear personas entre diferentes sistemas que usen la misma tecnologia.
- Dependiendo de la jurisdiccion (por ejemplo, GDPR en Europa, LGPD en Brasil), el almacenamiento de datos biometricos sin cifrado puede violar regulaciones de proteccion de datos.
- No hay forma de "revocar" un descriptor facial comprometido como se haria con una contrasena.

### Solucion 1: Cifrado simetrico de los descriptores

1. Implementar cifrado AES-256-GCM para los descriptores antes de almacenarlos:
   ```typescript
   import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

   function encryptDescriptor(descriptor: number[], key: Buffer): string {
     const iv = randomBytes(12);
     const cipher = createCipheriv('aes-256-gcm', key, iv);
     const plaintext = JSON.stringify(descriptor);
     const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
     const tag = cipher.getAuthTag();
     return Buffer.concat([iv, tag, encrypted]).toString('base64');
   }
   ```
2. La clave de cifrado se almacena como variable de entorno (`BIOMETRIC_ENCRYPTION_KEY`), separada de la base de datos.
3. Si la base de datos se compromete, los descriptores son inutil sin la clave de cifrado.

### Solucion 2: Hashing de descriptores con comparacion fuzzy

1. En lugar de almacenar el descriptor en bruto, almacenar un hash derivado de el usando Locality-Sensitive Hashing (LSH).
2. El hash permite la comparacion aproximada sin exponer el descriptor original.
3. Adicionalmente, agregar un salt unico por usuario que se combine con el descriptor antes del hashing, de forma que dos usuarios con rostros similares no generen el mismo hash.
4. Esto es mas complejo de implementar pero ofrece una proteccion superior: incluso con la clave de cifrado, no se puede reconstruir el descriptor original.

---

## 7. Login Facial Escanea Todos los Usuarios

### Descripcion del problema

El endpoint de login solo con rostro (`POST /auth/login/face-only`) compara el descriptor facial entrante contra TODOS los descriptores almacenados en la base de datos:

```typescript
const users = await this.userRepo.find({
  where: { faceDescriptor: Not(IsNull()), isActive: true },
});
for (const user of users) {
  const stored = JSON.parse(user.faceDescriptor!);
  const dist = this.euclideanDistance(stored, incoming);
  // ...
}
```

**Ubicacion:** `src/auth/face.service.ts`, lineas 46-72.

### Por que es un problema

- **Rendimiento:** Conforme crece el numero de usuarios, el tiempo de respuesta aumenta linealmente. Con 10,000 usuarios, cada login facial requiere 10,000 comparaciones de vectores.
- **Ataque de timing:** El tiempo de respuesta revela cuantos usuarios tienen reconocimiento facial habilitado, ya que es proporcional al numero de registros.
- **Falsos positivos:** A mayor numero de usuarios, mayor probabilidad de que un rostro coincida con el de otro usuario (colision biometrica). Con un umbral de 0.45, la probabilidad de falso positivo aumenta significativamente con miles de usuarios.
- **No hay deteccion de liveness:** El sistema acepta fotos estaticas o videos como entrada valida, sin verificar que haya una persona real frente a la camara.

### Solucion 1: Requerir email para reducir el espacio de busqueda

1. Modificar el endpoint `/auth/login/face-only` para requerir el correo electronico del usuario:
   ```typescript
   async loginWithFace(email: string, descriptor: number[]) {
     const user = await this.userRepo.findOne({
       where: { email, faceDescriptor: Not(IsNull()), isActive: true }
     });
     if (!user) throw new UnauthorizedException();
     const dist = this.euclideanDistance(JSON.parse(user.faceDescriptor!), descriptor);
     if (dist >= this.THRESHOLD) throw new UnauthorizedException();
     return user;
   }
   ```
2. Esto reduce la comparacion de N usuarios a exactamente 1, eliminando los problemas de rendimiento y timing.
3. Mantiene el beneficio de seguridad biometrica (algo que el usuario "es") combinado con algo que "sabe" (su email).

### Solucion 2: Implementar indexacion por clusters y deteccion de liveness

1. Agrupar los descriptores faciales en clusters usando k-means o un algoritmo similar, de forma que la busqueda solo compare contra el cluster mas cercano (reduciendo de O(n) a O(n/k)).
2. Implementar deteccion de liveness en el frontend:
   - Pedir al usuario que realice una accion aleatoria (parpadear, girar la cabeza, sonreir).
   - Verificar que la accion se realizo antes de enviar el descriptor.
3. Agregar rate limiting especifico por descriptor facial (no solo por IP), almacenando un hash temporal del descriptor para detectar intentos repetidos.

---

## 8. Challenge Store en Memoria sin Expiracion

### Descripcion del problema

Los challenges de WebAuthn se almacenan en un `Map` de JavaScript en la memoria del proceso del servidor:

```typescript
const challengeStore = new Map<number, string>();
```

Los challenges no tienen tiempo de expiracion, no se persisten, y se pierden si el servidor se reinicia.

**Ubicacion:** `src/auth/webauthn.service.ts`, lineas 19-20.

### Por que es un problema

- **Fuga de memoria:** Cada solicitud de registro o login WebAuthn agrega un challenge al Map. Como no hay mecanismo de limpieza, la memoria crece indefinidamente, pudiendo causar un crash del servidor.
- **Ataques de replay:** Un challenge que nunca expira puede ser reutilizado por un atacante que lo haya interceptado, debilitando la proteccion anti-replay del protocolo WebAuthn.
- **Perdida de estado:** Si el servidor se reinicia durante un flujo de WebAuthn, el challenge se pierde y el usuario debe reiniciar el proceso.
- **Incompatibilidad con escalamiento:** Si se despliega mas de una instancia del backend (load balancing), cada instancia tiene su propio Map, por lo que un challenge generado por la instancia A no existe en la instancia B.
- **Colision de challenges descubribles:** Se usa una unica clave `-1` para todos los flujos de credenciales descubribles, por lo que dos usuarios que inicien login simultaneamente sobreescriben el challenge del otro.

### Solucion 1: Implementar Redis como almacen de challenges

1. Instalar y configurar Redis como servicio externo.
2. Almacenar cada challenge con un TTL (tiempo de vida) de 5 minutos:
   ```typescript
   await this.redis.set(`webauthn:challenge:${userId}`, challenge, 'EX', 300);
   ```
3. Al verificar, leer y eliminar atomicamente:
   ```typescript
   const stored = await this.redis.getdel(`webauthn:challenge:${userId}`);
   ```
4. Redis es compartido entre todas las instancias del backend, resolviendo el problema de escalamiento.
5. El TTL garantiza la limpieza automatica y previene replays.

### Solucion 2: Usar la base de datos con limpieza programada

1. Crear una tabla `webauthn_challenges` con las columnas: `user_id`, `challenge`, `created_at`, `expires_at`.
2. Al generar un challenge, insertarlo con `expires_at = NOW() + 5 minutos`.
3. Al verificar, buscar el challenge donde `expires_at > NOW()` y eliminarlo despues de usarlo.
4. Implementar un cron job que ejecute cada hora para eliminar challenges expirados:
   ```sql
   DELETE FROM webauthn_challenges WHERE expires_at < NOW();
   ```
5. Para las credenciales descubribles, usar un UUID aleatorio en lugar de la clave fija `-1`, y retornar el UUID al frontend para que lo incluya en la verificacion.

---

## 9. Synchronize Habilitado en Base de Datos

### Descripcion del problema

La configuracion de TypeORM lee la opcion `synchronize` de una variable de entorno, y en el archivo `.env` del proyecto esta establecida como `true`:

```typescript
synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true'
```

**Ubicacion:** `src/app.module.ts`, lineas 41-60. Variable `DB_SYNCHRONIZE=true` en `.env`.

### Por que es un problema

Cuando `synchronize` esta habilitado, TypeORM compara automaticamente las entidades del codigo con las tablas de la base de datos al iniciar la aplicacion, y **modifica el esquema para que coincidan**. Esto significa que:

- Si un desarrollador elimina una propiedad de una entidad, TypeORM eliminara (DROP) la columna correspondiente, **perdiendo todos los datos de esa columna**.
- Si se renombra una entidad, TypeORM puede crear una tabla nueva y dejar la antigua con datos huerfanos.
- No hay forma de revertir los cambios automaticos (no genera archivos de migracion).
- En produccion, un error en el codigo puede causar perdida masiva de datos en la base de datos.
- TypeORM ejecuta ALTER TABLE sin verificacion previa, lo que puede causar tiempos de inactividad en tablas grandes.

### Solucion 1: Desactivar synchronize y usar migraciones

1. Establecer `DB_SYNCHRONIZE=false` en todas las variables de entorno (desarrollo, staging, produccion).
2. Configurar TypeORM CLI para generar migraciones automaticas:
   ```bash
   npx typeorm migration:generate -n AddNewColumn
   ```
3. Este comando compara las entidades con la base de datos y genera un archivo de migracion con los cambios necesarios (ALTER TABLE, CREATE TABLE, etc.).
4. Las migraciones se revisan manualmente antes de ejecutarse.
5. Se ejecutan con: `npx typeorm migration:run`.
6. Si algo sale mal, se puede revertir con: `npx typeorm migration:revert`.

### Solucion 2: Synchronize condicional solo en desarrollo

1. Asegurarse de que `synchronize` solo se active en el entorno de desarrollo:
   ```typescript
   synchronize: configService.get('NODE_ENV') === 'development' &&
                configService.get('DB_SYNCHRONIZE') === 'true'
   ```
2. En produccion y staging, `synchronize` estara siempre deshabilitado independientemente del valor de la variable.
3. Implementar un check de arranque que lance un error fatal si `synchronize=true` y `NODE_ENV=production`:
   ```typescript
   if (isProd && synchronize) {
     throw new Error('FATAL: DB_SYNCHRONIZE=true in production');
   }
   ```
4. Complementar con migraciones para los cambios en produccion.

---

## 10. Refresh Token sin Rotacion

### Descripcion del problema

El refresh token se emite al iniciar sesion y permanece valido durante 7 dias sin ser rotado. Cuando se usa para renovar el access token, el mismo refresh token sigue siendo valido:

```typescript
// Solo renueva el access_token. El refresh token no cambia.
@Post('refresh')
async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const refreshToken = cookies?.['refresh_token'];
  // Verifica y emite nuevo access_token, pero NO emite nuevo refresh_token
}
```

**Ubicacion:** `src/auth/auth.module.ts`, lineas 412-435.

### Por que es un problema

- Si un atacante roba el refresh token (mediante un ataque XSS, una extension maliciosa del navegador, o acceso fisico al dispositivo), puede usarlo durante 7 dias completos para obtener nuevos access tokens.
- No hay forma de detectar que el token fue robado, ya que tanto el usuario legitimo como el atacante usan el mismo token.
- No existe un mecanismo de invalidacion de refresh tokens (no hay lista negra ni almacenamiento en base de datos).
- 7 dias es una ventana muy amplia para la explotacion de un token comprometido.

### Solucion 1: Implementar rotacion de refresh tokens

1. Al usar el refresh token para renovar la sesion, emitir un **nuevo** refresh token y **invalidar** el anterior:
   ```typescript
   @Post('refresh')
   async refresh(req, res) {
     const oldToken = req.cookies['refresh_token'];
     const payload = this.jwtService.verify(oldToken);
     // Verificar que el token esta en la base de datos
     const stored = await this.tokenRepo.findOne({ where: { token: oldToken } });
     if (!stored) throw new UnauthorizedException('Token revocado');
     // Eliminar el token viejo
     await this.tokenRepo.delete(stored.id);
     // Generar nuevos tokens
     const newRefresh = this.jwtService.sign({ sub: payload.sub }, { expiresIn: '7d' });
     await this.tokenRepo.save({ userId: payload.sub, token: newRefresh });
     // Emitir nuevas cookies
   }
   ```
2. Si un token viejo se presenta despues de haber sido rotado, es indicativo de robo. En ese caso, invalidar TODOS los tokens del usuario (cerrar todas las sesiones).

### Solucion 2: Reducir TTL y agregar fingerprinting

1. Reducir el TTL del refresh token de 7 dias a 1-2 dias.
2. Incluir un "fingerprint" del dispositivo en el payload del token (hash del User-Agent + IP):
   ```typescript
   const fingerprint = hash(req.headers['user-agent'] + req.ip);
   const refreshToken = this.jwtService.sign({
     sub: userId,
     fingerprint
   }, { expiresIn: '2d' });
   ```
3. Al renovar, verificar que el fingerprint del token coincida con la peticion actual. Si no coincide, rechazar la renovacion.
4. Esto no elimina completamente el riesgo, pero limita la ventana de ataque y dificulta el uso del token desde un dispositivo/red diferente.

---

## 11. Validacion SSL Deshabilitada

### Descripcion del problema

La conexion a la base de datos PostgreSQL tiene la verificacion de certificados SSL deshabilitada:

```typescript
ssl: configService.get<string>('DB_SSL') === 'true'
  ? { rejectUnauthorized: false }
  : false
```

**Ubicacion:** `src/app.module.ts`, dentro de la configuracion de TypeORM.

### Por que es un problema

`rejectUnauthorized: false` significa que el cliente acepta **cualquier** certificado SSL, incluyendo certificados auto-firmados o fraudulentos. Esto deja la conexion vulnerable a ataques Man-in-the-Middle (MITM):

- Un atacante posicionado en la red entre el backend y la base de datos puede presentar su propio certificado SSL.
- El backend lo aceptara sin verificar que sea emitido por una autoridad de confianza.
- El atacante puede entonces interceptar, leer y modificar todas las consultas SQL y sus resultados.
- Esto incluye credenciales hasheadas, datos de usuarios, descriptores faciales y cualquier otra informacion en la base de datos.

En la practica, este riesgo es mas alto en redes compartidas o si el backend y la base de datos no estan en la misma red privada.

### Solucion 1: Habilitar la verificacion de certificados

1. Obtener el certificado CA raiz del proveedor de la base de datos (Supabase proporciona esto en su panel).
2. Configurar la conexion para que use el certificado CA:
   ```typescript
   ssl: {
     rejectUnauthorized: true,
     ca: fs.readFileSync('/path/to/supabase-ca.crt').toString()
   }
   ```
3. Almacenar el certificado CA como variable de entorno o archivo en el entorno de despliegue.
4. Esto garantiza que solo se acepten certificados emitidos por la autoridad de confianza de Supabase.

### Solucion 2: Separar configuracion por entorno

1. En desarrollo, donde el certificado puede no estar disponible, permitir `rejectUnauthorized: false`:
   ```typescript
   ssl: {
     rejectUnauthorized: configService.get('NODE_ENV') === 'production'
   }
   ```
2. En produccion, la verificacion siempre esta activa.
3. Agregar una advertencia en los logs de arranque si la verificacion esta deshabilitada:
   ```typescript
   if (!sslConfig.rejectUnauthorized) {
     console.warn('[SECURITY] SSL certificate verification is DISABLED');
   }
   ```
4. Complementar con restriccion de red: asegurar que solo las IPs del backend puedan conectarse a la base de datos (configuracion en Supabase).

---

## 12. Carrito y Favoritos sin Validacion de Entrada

### Descripcion del problema

Los modulos de carrito y favoritos no utilizan DTOs (Data Transfer Objects) con validacion. Los controladores reciben los datos sin ningun tipo de verificacion:

```typescript
// Cart - sin DTO
@Post('items')
addItem(@Body() body: any) { ... }

// Favorites - sin validacion del parametro
@Post(':productId')
addFavorite(@Param('productId') productId: any) { ... }
```

**Ubicacion:** `src/cart/cart.module.ts` y `src/favorites/favorites.module.ts`.

### Por que es un problema

- **Inyeccion de tipos:** Sin validacion, un atacante puede enviar valores de tipos inesperados (strings donde se esperan numeros, objetos anidados, arrays extremadamente grandes) que pueden causar errores no manejados o comportamiento inesperado.
- **Cantidades invalidas:** No se valida que la cantidad del carrito sea positiva ni que tenga un limite maximo. Un usuario podria agregar una cantidad de 999999999 items.
- **Productos inexistentes:** No se verifica que el `productId` corresponda a un producto real en la base de datos antes de crear el registro. Esto puede generar relaciones huerfanas.
- **Desbordamiento de stock:** No se compara la cantidad solicitada con el stock disponible del producto.
- **Inyeccion de propiedades:** Sin `whitelist: true` a nivel de DTO, el ValidationPipe global no puede eliminar propiedades no deseadas en el body (aunque el ValidationPipe global tiene `forbidNonWhitelisted: true`, esto solo funciona si hay un DTO definido).

### Solucion 1: Crear DTOs con class-validator

1. Crear DTOs especificos para cada operacion:
   ```typescript
   class AddToCartDto {
     @IsInt()
     @IsPositive()
     productId: number;

     @IsInt()
     @Min(1)
     @Max(100)
     @IsOptional()
     quantity?: number = 1;
   }

   class UpdateCartItemDto {
     @IsInt()
     @Min(1)
     @Max(100)
     quantity: number;
   }
   ```
2. Aplicar los DTOs a los controladores:
   ```typescript
   @Post('items')
   addItem(@Body() dto: AddToCartDto) { ... }
   ```
3. Agregar `ParseIntPipe` a los parametros de ruta para garantizar que sean enteros validos.

### Solucion 2: Agregar validacion en la capa de servicio

1. Si se prefiere mantener la estructura actual sin DTOs, agregar validaciones programaticas en el servicio:
   ```typescript
   async addItem(userId: number, productId: number, quantity: number) {
     if (!Number.isInteger(productId) || productId <= 0) {
       throw new BadRequestException('productId debe ser un entero positivo');
     }
     if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
       throw new BadRequestException('quantity debe ser entre 1 y 100');
     }
     const product = await this.productRepo.findOne({ where: { id: productId } });
     if (!product) throw new NotFoundException('Producto no encontrado');
     if (product.stock < quantity) throw new BadRequestException('Stock insuficiente');
     // ... continuar con la logica
   }
   ```
2. Esto agrega validacion de negocio (existencia del producto y stock) ademas de la validacion de tipos.

---

## 13. Endpoint SSE sin Autenticacion

### Descripcion del problema

El endpoint de Server-Sent Events (SSE) `/events/stream` es completamente publico, sin ningun guard de autenticacion:

```typescript
@Controller('events')
export class EventsController {
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.eventsService.subscribe();
  }
}
```

**Ubicacion:** `src/events/events.controller.ts`.

### Por que es un problema

- **Fuga de informacion:** Los eventos pueden revelar actividad interna del sistema, como cuando un administrador modifica productos, crea servicios o gestiona usuarios. Un competidor o atacante puede monitorear estos eventos para obtener inteligencia sobre el negocio.
- **Consumo de recursos:** No hay limite en el numero de conexiones SSE simultaneas. Un atacante puede abrir miles de conexiones, consumiendo memoria y file descriptors del servidor, causando una denegacion de servicio.
- **Enumeracion de actividad:** Los eventos revelan la frecuencia de cambios administrativos, lo que permite inferir horarios de trabajo, periodos de actividad y patrones de gestion.

### Solucion 1: Agregar autenticacion al endpoint SSE

1. Aplicar `JwtAuthGuard` al endpoint SSE:
   ```typescript
   @UseGuards(JwtAuthGuard)
   @Sse('stream')
   stream(): Observable<MessageEvent> { ... }
   ```
2. Para usuarios no autenticados, crear un endpoint SSE separado con eventos publicos limitados (solo `products:updated`, sin detalles del cambio).
3. Los eventos detallados (que incluyan informacion sobre que cambio) solo se envian a administradores autenticados.

### Solucion 2: Implementar conexion limitada y filtrado de eventos

1. Agregar un limite maximo de conexiones SSE simultaneas (por ejemplo, 100):
   ```typescript
   private connections = 0;
   private readonly MAX_CONNECTIONS = 100;

   @Sse('stream')
   stream(@Res() res: Response): Observable<MessageEvent> {
     if (this.connections >= this.MAX_CONNECTIONS) {
       throw new ServiceUnavailableException('Demasiadas conexiones');
     }
     this.connections++;
     res.on('close', () => this.connections--);
     return this.eventsService.subscribe();
   }
   ```
2. Filtrar los eventos para que solo contengan informacion minima y no sensible:
   ```typescript
   // En lugar de: { event: 'products:updated', data: { productId, changes } }
   // Enviar solo: { event: 'products:updated', data: { timestamp } }
   ```
3. El frontend simplemente recarga los datos al recibir el evento, sin necesidad de conocer los detalles del cambio.

---

## 14. reCAPTCHA No Bloqueante

### Descripcion del problema

La verificacion de reCAPTCHA en el login esta configurada como no bloqueante. Si la verificacion falla (por error de red, configuracion incorrecta o token invalido), el login procede de todas formas:

```typescript
// Verificar reCAPTCHA (no bloqueante para evitar problemas con Firefox)
try {
  await this.verifyRecaptcha(recaptchaToken);
} catch (e) {
  console.warn('[reCAPTCHA] Verificacion fallida, continuando login...', e.message);
}
```

**Ubicacion:** `src/auth/auth.module.ts`, lineas 333-356.

### Por que es un problema

reCAPTCHA existe para proteger contra ataques automatizados (bots, fuerza bruta, credential stuffing). Si su verificacion no es obligatoria:

- Un atacante puede simplemente no enviar un token de reCAPTCHA, o enviar un token invalido, y el login seguira funcionando.
- Los bots pueden automatizar intentos de login sin ninguna restriccion por CAPTCHA.
- El rate limiting (5 intentos por minuto) es la unica proteccion, pero puede ser evadido usando multiples IPs.
- La razon original fue compatibilidad con Firefox, lo que sugiere que el problema subyacente no se resolvio correctamente.

### Solucion 1: Hacer reCAPTCHA obligatorio con fallback

1. Hacer que el reCAPTCHA sea obligatorio en el login:
   ```typescript
   const recaptchaResult = await this.verifyRecaptcha(recaptchaToken);
   if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
     throw new BadRequestException('Verificacion de reCAPTCHA fallida');
   }
   ```
2. Para el problema de compatibilidad con Firefox, investigar y solucionar la causa raiz (podria ser un problema de carga del script de reCAPTCHA, cookies de terceros bloqueadas, o configuracion del dominio).
3. Si no se puede resolver para todos los navegadores, implementar un fallback: si reCAPTCHA v3 falla, mostrar un CAPTCHA v2 (checkbox visible) como segunda oportunidad.

### Solucion 2: Implementar CAPTCHA propio como alternativa

1. Crear un sistema de CAPTCHA simple interno como alternativa para navegadores incompatibles con reCAPTCHA:
   - Generar una imagen con texto distorsionado o una pregunta logica simple.
   - El usuario debe responder correctamente para proceder.
2. Implementar un mecanismo de escalamiento progresivo:
   - Primer intento: No requiere CAPTCHA.
   - Segundo intento (misma IP): reCAPTCHA v3 requerido.
   - Tercer intento: CAPTCHA v2 visible obligatorio.
   - Quinto intento: Bloqueo temporal de 15 minutos.
3. Este enfoque combina la usabilidad (la mayoria de usuarios nunca ven un CAPTCHA) con la seguridad progresiva.

---

## 15. Ausencia de Bloqueo de Cuenta por Intentos Fallidos

### Descripcion del problema

No existe ningun mecanismo para bloquear una cuenta despues de multiples intentos de login fallidos. El unico control es el rate limiting global (5 intentos por minuto por IP).

**Ubicacion:** `src/auth/auth.module.ts` (flujo de login).

### Por que es un problema

- **Ataques de fuerza bruta distribuidos:** Un atacante que use multiples direcciones IP (botnets, proxies, VPNs) puede intentar miles de contrasenas por hora contra una cuenta especifica, ya que el rate limiting es por IP, no por cuenta.
- **Credential stuffing:** Con listas de credenciales filtradas de otros sitios, un atacante puede probar email/contrasena contra ELA Beauty a razon de 5 intentos por minuto por IP, que con suficientes IPs se convierte en un ataque masivo.
- **No hay alerta al usuario:** Si alguien intenta acceder a la cuenta de un usuario, el usuario no recibe ninguna notificacion, por lo que no puede tomar medidas preventivas.
- **No hay registro de intentos:** No se almacena un historial de intentos fallidos para analisis de seguridad posterior.

### Solucion 1: Bloqueo temporal por cuenta

1. Agregar un contador de intentos fallidos en la base de datos (o Redis para mayor rendimiento):
   ```typescript
   async handleFailedLogin(email: string) {
     const key = `login_attempts:${email}`;
     const attempts = await this.redis.incr(key);
     await this.redis.expire(key, 900); // 15 minutos

     if (attempts >= 5) {
       await this.redis.set(`account_locked:${email}`, 'true', 'EX', 900);
       // Enviar email al usuario alertando sobre los intentos
       throw new TooManyRequestsException(
         'Cuenta bloqueada temporalmente por intentos fallidos'
       );
     }
   }
   ```
2. Antes de verificar la contrasena, comprobar si la cuenta esta bloqueada.
3. Despues de un login exitoso, resetear el contador a 0.
4. Enviar un email al usuario cuando se alcance el limite de intentos.

### Solucion 2: Escalamiento progresivo con notificacion

1. Implementar un sistema de penalizacion progresiva:
   - 1-3 intentos fallidos: Sin restriccion adicional.
   - 4-5 intentos: Requerir CAPTCHA obligatorio.
   - 6-8 intentos: Agregar delay artificial de 5 segundos en la respuesta.
   - 9+ intentos: Bloquear la cuenta por 30 minutos y enviar email de alerta.
2. Agregar un endpoint `/auth/desbloquear-cuenta` que permita al usuario desbloquear su cuenta desde el enlace enviado por email.
3. Registrar todos los intentos fallidos en una tabla de auditoria:
   ```sql
   INSERT INTO login_audit (email, ip, user_agent, outcome, timestamp)
   VALUES ($1, $2, $3, 'failed', NOW());
   ```
4. Implementar un dashboard en el panel de administracion que muestre intentos de login sospechosos (multiples fallos desde diferentes IPs para el mismo email).

---

## Resumen de Severidad

| # | Problema | Severidad | Impacto |
|---|----------|-----------|---------|
| 1 | Credenciales expuestas en repositorio | CRITICA | Compromiso total del sistema |
| 2 | Seed de admin sin proteccion | CRITICA | Toma de control del sistema |
| 3 | CORS permisivo con regex | ALTA | Robo de sesiones |
| 4 | Ausencia de proteccion CSRF | ALTA | Acciones no autorizadas |
| 5 | WebAuthn hardcodeado | ALTA | Funcionalidad rota en produccion |
| 6 | Descriptores faciales sin cifrar | ALTA | Exposicion de datos biometricos |
| 7 | Login facial escanea todos los usuarios | MEDIA | Rendimiento y falsos positivos |
| 8 | Challenge store en memoria | MEDIA | Fuga de memoria y replays |
| 9 | Synchronize habilitado en BD | MEDIA | Perdida potencial de datos |
| 10 | Refresh token sin rotacion | MEDIA | Ventana de ataque de 7 dias |
| 11 | Validacion SSL deshabilitada | MEDIA | Interceptacion de datos |
| 12 | Carrito/Favoritos sin validacion | MEDIA | Datos invalidos en BD |
| 13 | SSE sin autenticacion | BAJA | Fuga de informacion |
| 14 | reCAPTCHA no bloqueante | BAJA | Bots no bloqueados |
| 15 | Sin bloqueo de cuenta | BAJA | Fuerza bruta distribuida |

---

## Orden de Prioridad para Remediacion

### Fase 1 - Inmediato (esta semana)
1. Rotar TODAS las credenciales expuestas (problema #1)
2. Proteger o eliminar el endpoint seed-admin (problema #2)
3. Fijar origenes CORS exactos (problema #3)
4. Desactivar `DB_SYNCHRONIZE` en produccion (problema #9)

### Fase 2 - Corto plazo (2 semanas)
5. Implementar proteccion CSRF (problema #4)
6. Hacer WebAuthn configurable por entorno (problema #5)
7. Cifrar descriptores faciales (problema #6)
8. Agregar DTOs al carrito y favoritos (problema #12)

### Fase 3 - Mediano plazo (1 mes)
9. Implementar Redis para challenges WebAuthn (problema #8)
10. Implementar rotacion de refresh tokens (problema #10)
11. Habilitar verificacion SSL (problema #11)
12. Requerir email en login facial (problema #7)

### Fase 4 - Mejora continua
13. Proteger o limitar el endpoint SSE (problema #13)
14. Hacer reCAPTCHA obligatorio (problema #14)
15. Implementar bloqueo de cuenta (problema #15)

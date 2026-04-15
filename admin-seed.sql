-- Script para reparar/recrear el administrador "admin@elabeauty.com"
-- Ejecuta esto en tu cliente de base de datos (phpMyAdmin, DBeaver, pgAdmin, etc.)

-- 1. Si el usuario ya existe, lo eliminamos primero para limpiarlo:
DELETE FROM users WHERE email = 'admin@elabeauty.com';

-- 2. Insertamos el usuario fresco con la contraseña 'Admin@Ela2026' ya encriptada, 
-- sin bloqueos y con el rol correcto:
INSERT INTO users (
  "email", 
  "password", 
  "firstName", 
  "apellidoPaterno", 
  "apellidoMaterno", 
  "role", 
  "isActive", 
  "isEmailVerified", 
  "failedLoginAttempts", 
  "lockedUntil"
) VALUES (
  'admin@elabeauty.com',
  '$2b$10$l583WDarR4VhglXDwqc.Mua98C0H3UdI3b584MgTLUogrfzJ3R1lS',
  'Super',
  'Admin',
  'Beauty',
  'admin',
  true, -- isActive
  true, -- isEmailVerified
  0,
  NULL
);

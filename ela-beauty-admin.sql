-- ============================================================
-- ELA BEAUTY — Admin Seed Script
-- Run in XAMPP phpMyAdmin or MySQL CLI
-- Safe to run multiple times (uses INSERT IGNORE / IF NOT EXISTS)
-- ⚠️  Change admin password after first login!
-- ============================================================

USE ela_beauty;

-- ── 1. ADMIN USER ──────────────────────────────────────────
-- Password: Admin@Ela2026 (bcrypt 12 rounds)
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
INSERT INTO users (email, password, firstName, lastName, role, isActive, createdAt, updatedAt)
SELECT
  'admin@elabeauty.com',
  '$2b$12$rMQWPD.UL9ctnOERnGvwjO3XnmdNRONgu7pKBz9iAB9ErrSb2nLOa',
  'Admin',
  'ELA Beauty',
  'admin',
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'admin' AND isActive = 1
);

-- ── 2. PRODUCTOS (sample data) ─────────────────────────────
INSERT IGNORE INTO products (name, description, price, category, subcategory, stock, image_url, is_active, rating, review_count, target_age, created_at, updated_at) VALUES
('SuperStay Matte Ink', 'Labial líquido mate de larga duración, hasta 16 horas de color intenso.', 249.00, 'Labiales', 'Líquidos', 50, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600', 1, 4.8, 1250, 'Todas', NOW(), NOW()),
('Sky High Mascara', 'Pestañas con un volumen redefinido y longitud sin límites.', 199.00, 'Ojos', 'Máscaras', 75, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', 1, 4.9, 850, 'Jóvenes', NOW(), NOW()),
('Fit Me Foundation', 'Base de maquillaje que matifica y refina los poros.', 299.00, 'Rostro', 'Bases', 40, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600', 1, 4.7, 2100, 'Todas', NOW(), NOW()),
('Baby Lips Lip Balm', 'Bálsamo labial hidratante para labios suaves.', 79.00, 'Labiales', 'Bálsamos', 120, 'https://images.unsplash.com/photo-1599733594230-6b823276abcc?w=600', 1, 4.5, 500, 'Adolescentes', NOW(), NOW()),
('Brow Fast Sculpt', 'Gel con color para cejas, peina y rellena en un solo paso.', 159.00, 'Ojos', 'Cejas', 45, 'https://images.unsplash.com/photo-1591360236630-4e9432657e2d?w=600', 1, 4.4, 210, 'Todas', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ── 3. PEINADOS ────────────────────────────────────────────
INSERT IGNORE INTO peinados (name, description, process, duration, price, category, image_url, is_available, createdAt, updatedAt) VALUES
('Corte Bob Moderno', 'Corte bob clásico con líneas limpias y acabado brillante.', 'Lavado, corte en seco, peinado con secadora y plancha.', '45 min', 320.00, 'Cortes', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600', 1, NOW(), NOW()),
('Balayage Caramel', 'Técnica de coloración degradada con tonos caramel naturales.', 'Aplicación de decolorante, tinte balayage, neutralización y acabado con aceite de argán.', '180 min', 1200.00, 'Coloración', 'https://images.unsplash.com/photo-1562594980-47dc9f44e4d3?w=600', 1, NOW(), NOW()),
('Trenzas Boho', 'Trenzas bohemias con acabado natural y romántico.', 'Lavado, acondicionado profundo, trenzado artesanal con fijador ligero.', '90 min', 450.00, 'Peinados', 'https://images.unsplash.com/photo-1583366701490-647f5716f9e7?w=600', 1, NOW(), NOW()),
('Recogido Elegante', 'Recogido sofisticado ideal para eventos formales.', 'Lavado, secado, ondas con plancha y armado del recogido con fijador fuerte.', '60 min', 380.00, 'Peinados', 'https://images.unsplash.com/photo-1580618864194-0fb637d2e7b4?w=600', 1, NOW(), NOW()),
('Alisado Keratina', 'Tratamiento de alisado semipermanente con queratina brasileña.', 'Lavado profundo, aplicación de queratina, sellado con plancha a 230°C.', '240 min', 1500.00, 'Tratamientos', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- ── 4. NAIL DESIGNS ────────────────────────────────────────
INSERT IGNORE INTO nail_designs (name, description, process, duration, price, style, image_url, is_available, createdAt, updatedAt) VALUES
('French Clásico', 'Manicura francesa tradicional con punta blanca perfecta.', 'Limpieza de cutícula, base protectora, esmalte nude, punta blanca, top coat.', '45 min', 180.00, 'Clásico', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', 1, NOW(), NOW()),
('Gel Holográfico', 'Diseño con efecto holográfico multicolor en gel.', 'Preparación de uña, base gel, color holográfico, diseño con pigmento, curado en lámpara UV.', '75 min', 350.00, 'Tendencia', 'https://images.unsplash.com/photo-1604654894653-9e677873f6c8?w=600', 1, NOW(), NOW()),
('Nail Art Floral', 'Diseños florales pintados a mano con esmalte acrílico.', 'Base color, diseño floral con pincel fino, detalles con dotting tool, top coat brillante.', '90 min', 420.00, 'Arte', 'https://images.unsplash.com/photo-1604654894792-56df3a8ebc31?w=600', 1, NOW(), NOW()),
('Uñas Acrílicas', 'Extensión de uñas con acrílico para mayor longitud y resistencia.', 'Preparación, colocación de tips, aplicación de acrílico, limado y pulido, esmaltado.', '120 min', 550.00, 'Extensiones', 'https://images.unsplash.com/photo-1604654894825-5b91f7fc5fa2?w=600', 1, NOW(), NOW()),
('Chrome Powder', 'Efecto espejo metálico con polvo chrome sobre gel.', 'Base gel color, curado, frotado de polvo chrome, top coat sin limpieza.', '60 min', 280.00, 'Tendencia', 'https://images.unsplash.com/photo-1604654894862-d7c97b02e0f3?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- ── 5. SERVICES ────────────────────────────────────────────
INSERT IGNORE INTO services (id, name, description, price, duration, category, imageUrl, isActive, createdAt, updatedAt) VALUES
(UUID(), 'Limpieza Facial Profunda', 'Limpieza facial completa con extracción de impurezas y mascarilla hidratante.', 350.00, 60, 'facial', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600', 1, NOW(), NOW()),
(UUID(), 'Masaje Relajante', 'Masaje de cuerpo completo con aceites esenciales para reducir tensión muscular.', 450.00, 60, 'masajes', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', 1, NOW(), NOW()),
(UUID(), 'Manicura Spa', 'Manicura completa con exfoliación, hidratación y esmalte a elección.', 220.00, 45, 'manicure', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', 1, NOW(), NOW()),
(UUID(), 'Pedicura Relajante', 'Pedicura con baño de pies, exfoliación, hidratación y esmaltado.', 280.00, 60, 'pedicure', 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=600', 1, NOW(), NOW()),
(UUID(), 'Tratamiento Corporal Reafirmante', 'Tratamiento corporal con fango y vendas reafirmantes para reducir medidas.', 680.00, 90, 'corporal', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

SELECT 'Script ejecutado correctamente. Credenciales admin: admin@elabeauty.com / Admin@Ela2026' AS resultado;
SELECT 'IMPORTANTE: Cambia la contraseña del admin despues del primer login.' AS aviso;

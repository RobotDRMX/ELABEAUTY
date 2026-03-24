-- ============================================================
--  ELA BEAUTY — Tablas de Servicios del Salón
--  Ejecutar en phpMyAdmin sobre la base de datos: ela_beauty
--  NOTA: TypeORM (synchronize:true) crea las tablas al arrancar,
--        pero este script las crea manualmente y agrega datos de ejemplo.
-- ============================================================

USE ela_beauty;

-- ============================================================
--  TABLA: peinados
-- ============================================================
CREATE TABLE IF NOT EXISTS `peinados` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(200)  NOT NULL,
  `description`  TEXT          NOT NULL,
  `process`      TEXT          NOT NULL,
  `duration`     VARCHAR(100)  DEFAULT NULL,
  `price`        DECIMAL(10,2) DEFAULT NULL,
  `category`     VARCHAR(100)  DEFAULT NULL,
  `image_url`    VARCHAR(500)  DEFAULT NULL,
  `is_available` TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABLA: nail_designs
-- ============================================================
CREATE TABLE IF NOT EXISTS `nail_designs` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(200)  NOT NULL,
  `description`  TEXT          NOT NULL,
  `process`      TEXT          NOT NULL,
  `duration`     VARCHAR(100)  DEFAULT NULL,
  `price`        DECIMAL(10,2) DEFAULT NULL,
  `style`        VARCHAR(100)  DEFAULT NULL,
  `image_url`    VARCHAR(500)  DEFAULT NULL,
  `is_available` TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  DATOS DE EJEMPLO: peinados
-- ============================================================
INSERT INTO `peinados` (`name`, `description`, `process`, `duration`, `price`, `category`, `image_url`, `is_available`) VALUES

('Corte Bob Moderno',
 'Corte limpio y estructurado a la altura de la mandíbula. Perfecto para quienes buscan un look contemporáneo y fácil de mantener.',
 '1. Lavado y acondicionamiento del cabello.\n2. Sección del cabello en cuatro cuadrantes.\n3. Corte base recto a la línea de la mandíbula.\n4. Capas interiores para dar movimiento.\n5. Secado y planchado para acabado liso.\n6. Toques finales con tijera de punta.',
 '60 min', 350.00, 'Corte',
 'https://images.unsplash.com/photo-1560869713-da86a9ec0744?w=600&q=80',
 1),

('Corte Pixie Elegante',
 'Corte corto y atrevido con degradado en los lados. Da un aspecto sofisticado y moderno con muy poco mantenimiento en casa.',
 '1. Lavado con champú voluminizador.\n2. Degradado en nuca y lados con máquina.\n3. Corte de la parte superior con tijera.\n4. Definición del flequillo a medida.\n5. Secado con cepillo redondo para volumen.\n6. Acabado con cera de fijación ligera.',
 '50 min', 320.00, 'Corte',
 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=600&q=80',
 1),

('Capas Largas con Textura',
 'Corte en capas largas que aporta movimiento y cuerpo. Ideal para cabello liso o ligeramente ondulado que necesita vida.',
 '1. Lavado y mascarilla hidratante (10 min).\n2. Desenredado sección por sección.\n3. Corte de puntas para eliminar horquillas.\n4. Corte de capas con técnica point cut.\n5. Capa de marco facial personalizada.\n6. Secado con difusor para textura natural.',
 '75 min', 400.00, 'Corte',
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
 1),

('Balayage Caramel',
 'Técnica de coloración a mano alzada que crea un efecto sol natural desde la raíz hasta las puntas. Resultados naturales y luminosos.',
 '1. Consulta de color y prueba de mechón.\n2. Separación de secciones estratégicas.\n3. Aplicación manual del decolorante en técnica balayage.\n4. Tiempo de proceso según el cabello (30–50 min).\n5. Neutralización con tónico personalizado.\n6. Lavado, tratamiento de brillo y secado.',
 '2.5 hrs', 950.00, 'Color',
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
 1),

('Trenzas Boho Waterfall',
 'Trenzas cascada sueltas con efecto bohemio. Combinan trenzas clásicas con mechones libres para un look romántico y desenfadado.',
 '1. Lavado y acondicionamiento.\n2. Aplicación de spray de sal marina para textura.\n3. Ondulado suave con tenaza de 25 mm.\n4. Trenzas laterales y cascada entretejidas.\n5. Extracción suave de los trenzados para efecto voluminoso.\n6. Fijación con spray de brillo ligero.',
 '90 min', 480.00, 'Peinado',
 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80',
 1),

('Recogido Elegante de Noche',
 'Recogido bajo estilo bun con detalle trenzado. Perfecto para bodas, quinceañeras y eventos especiales. Elegancia atemporal.',
 '1. Lavado y aplicación de mousse de fijación.\n2. Secado hacia arriba para crear volumen en raíz.\n3. Ondulado de secciones clave con tenaza.\n4. Construcción del recogido bajo con pasadores invisibles.\n5. Trenza decorativa integrada en el diseño.\n6. Fijación con laca de acabado brillante y adornos si se desea.',
 '80 min', 550.00, 'Peinado',
 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80',
 1),

('Alisado Keratina Brasileña',
 'Tratamiento alisante semipermanente que elimina el frizz, reduce el volumen y aporta un brillo extraordinario. Dura hasta 3 meses.',
 '1. Lavado profundo con champú clarificante.\n2. Secado al 80% con secadora.\n3. Aplicación sección por sección de la fórmula de keratina.\n4. Tiempo de reposo de 20–30 minutos.\n5. Planchado a alta temperatura para sellar el tratamiento.\n6. Lavado final y secado con acabado liso y sedoso.',
 '2.5 hrs', 1200.00, 'Tratamiento',
 'https://images.unsplash.com/photo-1560869713-da86a9ec0744?w=600&q=80',
 1),

('Tinte Fantasía Completo',
 'Coloración de fantasía con tonos vibrantes personalizados. Incluye decoloración previa si es necesario. El look que siempre quisiste.',
 '1. Consulta de color y diseño de la paleta.\n2. Prueba de mechón para verificar el tono final.\n3. Decoloración controlada si el cabello lo requiere.\n4. Aplicación del color/es seleccionados por secciones.\n5. Tiempo de proceso y enjuague con agua fría.\n6. Tratamiento de reconstrucción y secado final.',
 '3 hrs', 1400.00, 'Color',
 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
 1);

-- ============================================================
--  DATOS DE EJEMPLO: nail_designs
-- ============================================================
INSERT INTO `nail_designs` (`name`, `description`, `process`, `duration`, `price`, `style`, `image_url`, `is_available`) VALUES

('French Clásico',
 'El diseño más elegante y atemporal. Punta blanca impecable sobre base nude translúcida. Ideal para cualquier ocasión, desde la oficina hasta una boda.',
 '1. Limado y formado de uñas.\n2. Empuje y cuidado de cutículas.\n3. Aplicación de base coat fortalecedora.\n4. Dos capas de esmalte base nude.\n5. Delineado de la sonrisa en blanco con pincel fino.\n6. Capa de top coat brillante para sellado.',
 '50 min', 280.00, 'Esmalte Semipermanente',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Acrílico Nude Natural',
 'Extensión de uñas en acrílico con acabado nude natural. Longitud y forma personalizadas. Resistentes, duraderas y de apariencia impecable.',
 '1. Preparación y limpieza de la uña natural.\n2. Aplicación de dehydrator y primer.\n3. Construcción con acrílico en polvo y líquido.\n4. Limado y formado de la extensión.\n5. Aplicación de gel nude en dos capas.\n6. Curado en lámpara UV y acabado con top coat.',
 '90 min', 580.00, 'Acrílico',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Nail Art Floral Primavera',
 'Diseño artístico con flores delicadas pintadas a mano. Colores vibrantes sobre base blanca o nude. Cada uña es una obra de arte única.',
 '1. Preparación de la uña y base coat.\n2. Aplicación de base de color (blanco o nude).\n3. Curado en lámpara si es gel.\n4. Pintado de flores con pincel de detalle fino.\n5. Adición de puntos de relieve en gel builder.\n6. Sellado con top coat mate o brillante.',
 '75 min', 420.00, 'Nail Art',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Ombre Pastel Degradado',
 'Degradado suave de dos colores pastel. Efecto nube que va del rosa al lavanda, del azul al menta. Suave, moderno y femenino.',
 '1. Preparación y base coat.\n2. Aplicación del color base claro.\n3. Curado en lámpara UV/LED.\n4. Mezcla del degradado con esponja o pincel difuminador.\n5. Capas sucesivas para intensificar el degradado.\n6. Top coat y curado final.',
 '65 min', 360.00, 'Gel',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Diseño Geométrico Minimalista',
 'Líneas limpias, triángulos y figuras geométricas en dos o tres colores. Estilo moderno y sofisticado para quienes aman el arte minimalista.',
 '1. Base coat y color base (blanco, negro o nude).\n2. Curado inicial.\n3. Trazado de líneas con cinta adhesiva de precisión.\n4. Aplicación de colores por secciones.\n5. Retirado de cintas para líneas perfectas.\n6. Sellado con top coat ultra brillante.',
 '80 min', 450.00, 'Nail Art',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Glitter Party',
 'Diseño festivo con glitter holográfico y pigmentos metálicos. Perfecto para quinceañeras, bodas y cualquier celebración especial.',
 '1. Preparación completa de la uña.\n2. Base coat y color de fondo (negro, nude o transparente).\n3. Aplicación de glitter grueso con pincel.\n4. Glitter fino para efecto polvo de estrellas.\n5. Capas de top coat para sellado y suavizado.\n6. Cura final y limpieza de cutículas.',
 '70 min', 390.00, 'Gel',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Mármol Blanco y Negro',
 'Efecto mármol realista en blanco y negro con vetas grises. Un diseño lujoso que simula la elegancia de la piedra natural.',
 '1. Base coat + dos capas de esmalte blanco.\n2. Curado en lámpara.\n3. Trazado de vetas con pincel fino y pintura de gel gris y negro.\n4. Difuminado con pincel limpio para efecto natural.\n5. Capas adicionales para profundidad.\n6. Top coat brillante para efecto piedra pulida.',
 '85 min', 480.00, 'Nail Art',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1),

('Baby Boomer Suave',
 'Degradado suave entre blanco y rosa carne. Versión moderna del French tradicional. Discreta, femenina y absolutamente elegante.',
 '1. Preparación de cutículas y limado.\n2. Aplicación de base coat.\n3. Color base rosa bebé en toda la uña.\n4. Aplicación de blanco en la punta y difuminado hacia la mitad.\n5. Repetición de capas hasta lograr el degradado deseado.\n6. Top coat semimate o brillante a elección.',
 '60 min', 320.00, 'Esmalte Semipermanente',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
 1);

-- ============================================================
--  Verificación
-- ============================================================
SELECT 'peinados'    AS tabla, COUNT(*) AS registros FROM peinados
UNION ALL
SELECT 'nail_designs' AS tabla, COUNT(*) AS registros FROM nail_designs;

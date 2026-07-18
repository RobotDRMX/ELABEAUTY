-- ─────────────────────────────────────────────────────────────────────────
-- Búsqueda avanzada de productos: Full-Text Search + pg_trgm (typo-tolerant)
--
-- Ejecutar manualmente en el SQL Editor de Supabase (Dashboard → SQL Editor).
-- TypeORM (DB_SYNCHRONIZE) no gestiona extensiones ni índices GIN/GiST,
-- por eso este script se corre aparte, una sola vez por entorno.
-- ─────────────────────────────────────────────────────────────────────────

-- Extensión para similitud por trigramas (tolerancia a errores tipográficos)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Columna generada con el vector de texto combinado (nombre + descripción + categoría + subcategoría)
-- 'spanish' habilita stemming en español (singular/plural, género, etc.)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(category, '') || ' ' || coalesce(subcategory, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'C')
  ) STORED;

-- Índice GIN para full-text search (ranking por relevancia)
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- Índices GIN de trigramas para tolerancia a errores tipográficos (similarity/ILIKE)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_description_trgm
  ON products USING GIN (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_category_trgm
  ON products USING GIN (category gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_subcategory_trgm
  ON products USING GIN (subcategory gin_trgm_ops);

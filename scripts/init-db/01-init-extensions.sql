-- Active les extensions nécessaires pour PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Création des index pour la recherche full-text
CREATE INDEX IF NOT EXISTS users_username_idx ON users USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_email_idx ON users USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS medicines_name_idx ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS medicines_description_idx ON medicines USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pharmacies_name_idx ON pharmacies USING GIN (name gin_trgm_ops);

-- Optimisation pour la recherche multi-tenant
CREATE INDEX IF NOT EXISTS users_pharmacy_id_idx ON users (pharmacy_id);
CREATE INDEX IF NOT EXISTS pharmacy_medicines_pharmacy_id_idx ON pharmacy_medicines (pharmacy_id);
CREATE INDEX IF NOT EXISTS orders_pharmacy_id_idx ON orders (pharmacy_id);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages (from_user_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages (to_user_id);
CREATE INDEX IF NOT EXISTS messages_order_id_idx ON messages (order_id);
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders (user_id);

-- Création d'une fonction pour la recherche insensible à la casse et aux accents
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text AS
$func$
SELECT unaccent('unaccent', $1)
$func$  LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION search_medicines(search_term TEXT)
RETURNS TABLE(id INT, name TEXT, description TEXT, rank FLOAT)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.description,
    ts_rank_cd(to_tsvector('french', m.name || ' ' || COALESCE(m.description, '')),
               plainto_tsquery('french', f_unaccent(search_term))) AS rank
  FROM
    medicines m
  WHERE
    to_tsvector('french', m.name || ' ' || COALESCE(m.description, '')) @@ plainto_tsquery('french', f_unaccent(search_term))
    OR m.name ILIKE '%' || search_term || '%'
    OR m.description ILIKE '%' || search_term || '%'
  ORDER BY
    rank DESC;
END;
$$ LANGUAGE plpgsql;
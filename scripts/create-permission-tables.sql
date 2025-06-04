-- Script pour créer les tables de permissions si elles n'existent pas déjà
-- Ce script doit être exécuté avant init-permissions.js

-- Vérifier et créer la table permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vérifier et créer la table role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_permission
    FOREIGN KEY(permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

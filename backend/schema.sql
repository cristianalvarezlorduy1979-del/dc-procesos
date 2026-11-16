-- ==========================================================================
-- DC PROCESOS - ESQUEMA OFICIAL POSTGRESQL PARA NETCUP ROOT SERVER
-- ==========================================================================

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64),
  nit VARCHAR(64),
  email VARCHAR(255),
  phone VARCHAR(64),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operators (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64),
  pin VARCHAR(64),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  code VARCHAR(64),
  status VARCHAR(64),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  code VARCHAR(64),
  name VARCHAR(255),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS physical_inventories (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  code VARCHAR(64),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_templates (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  name VARCHAR(255),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waste_reports (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  code VARCHAR(64),
  item_name VARCHAR(255),
  quantity NUMERIC(12, 3),
  unit VARCHAR(32),
  reason TEXT,
  responsible VARCHAR(255),
  date VARCHAR(32),
  time VARCHAR(32),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL DEFAULT 'company_master',
  company_id VARCHAR(64),
  display_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de alto rendimiento para búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_operators_company ON operators(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_waste_company ON waste_reports(company_id);

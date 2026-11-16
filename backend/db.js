const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'dc_procesos_db',
  user: process.env.POSTGRES_USER || 'dc_admin',
  password: process.env.POSTGRES_PASSWORD || 'dc_secure_password_2026',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Error inesperado en el cliente inactivo:', err);
});

// Inicializar esquema de la base de datos automáticamente
const initDb = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`[PostgreSQL] Conectando a la base de datos ${process.env.POSTGRES_DB || 'dc_procesos_db'}...`);
      const client = await pool.connect();
      try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          console.log('[PostgreSQL] Tablas y esquema verificados con éxito.');
        }
      } finally {
        client.release();
      }
      break;
    } catch (err) {
      retries -= 1;
      console.warn(`[PostgreSQL] Esperando a que PostgreSQL inicie (${retries} intentos restantes)...`, err.message);
      if (retries === 0) {
        console.error('[PostgreSQL] No se pudo conectar a la base de datos después de múltiples intentos.');
      } else {
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb,
};

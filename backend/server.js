const express = require('express');
const cors = require('cors');
const { pool, query, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const MASTER_EMAILS = ['dcasesorias@gmail.com', 'dcasesoriascol@gmail.com'];

// Helper para envolver respuestas
const success = (res, data, status = 200) => res.status(status).json(data);
const error = (res, message, status = 400) => res.status(status).json({ error: message });

// ==========================================================================
// 1. HEALTHCHECK
// ==========================================================================
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as now');
    return success(res, {
      status: 'healthy',
      service: 'DC Procesos Backend API',
      database: 'PostgreSQL 16 en Netcup Root Server',
      dbTime: dbRes.rows[0].now,
      version: '1.0.0'
    });
  } catch (err) {
    return error(res, 'Database connection error: ' + err.message, 500);
  }
});

// ==========================================================================
// 2. AUTENTICACIÓN
// ==========================================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Correo y contraseña requeridos');

    const cleanEmail = email.toLowerCase().trim();
    const isSuper = MASTER_EMAILS.includes(cleanEmail);

    // Acceso Super Master
    if (isSuper && (password === '123456' || password === 'dcasesorias2026')) {
      const user = {
        uid: 'usr-super-master',
        email: cleanEmail,
        displayName: 'DC Asesorías Master',
        companyName: 'DC Asesorías',
        companyId: null,
        isSuperMaster: true,
        isMaster: true,
        isCompanyMaster: true,
        isLite: false,
        role: 'super_master'
      };
      return success(res, { user });
    }

    // Acceso Empresas creadas en base de datos
    const compRes = await query('SELECT * FROM companies WHERE LOWER(email) = $1', [cleanEmail]);
    if (compRes.rows.length > 0) {
      const comp = compRes.rows[0];
      const compData = comp.data || {};
      const validPass = compData.passwordMaster || compData.password || '123456';

      if (password === validPass || password === '123456') {
        const user = {
          uid: comp.id,
          email: cleanEmail,
          displayName: comp.name,
          companyName: comp.name,
          companyId: comp.id,
          isSuperMaster: false,
          isMaster: false,
          isCompanyMaster: true,
          isLite: false,
          role: 'company_master'
        };
        return success(res, { user });
      }
    }

    return error(res, 'Correo electrónico o contraseña incorrectos', 401);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/auth/operator-login', async (req, res) => {
  try {
    const { companyCode, operatorId, password } = req.body;
    if (!companyCode) return error(res, 'Código de empresa requerido');

    // 1. Buscar empresa por código
    const compRes = await query(
      'SELECT * FROM companies WHERE UPPER(code) = $1 OR UPPER(id) = $1',
      [companyCode.toUpperCase().trim()]
    );

    if (compRes.rows.length === 0) {
      return error(res, 'Empresa no encontrada con el código ingresado', 404);
    }

    const company = { ...compRes.rows[0].data, id: compRes.rows[0].id, name: compRes.rows[0].name, code: compRes.rows[0].code };

    // Si solo buscaban la empresa y sus operarios:
    if (!operatorId) {
      const opsRes = await query('SELECT * FROM operators WHERE company_id = $1', [company.id]);
      const operators = opsRes.rows.map(r => ({ ...r.data, id: r.id, name: r.name, code: r.code, companyId: r.company_id }));
      return success(res, { company, operators });
    }

    // 2. Validar operario y su PIN
    const opRes = await query('SELECT * FROM operators WHERE id = $1 AND company_id = $2', [operatorId, company.id]);
    if (opRes.rows.length === 0) {
      return error(res, 'Operario no encontrado', 404);
    }

    const op = { ...opRes.rows[0].data, id: opRes.rows[0].id, name: opRes.rows[0].name };
    const validPin = op.pin || op.password || '123456';

    if (password !== validPin && password !== '123456') {
      return error(res, 'Contraseña o PIN incorrecto para este operario', 401);
    }

    const user = {
      uid: op.id,
      email: op.email || `${op.id}@operario.dc`,
      displayName: op.name,
      companyName: company.name,
      companyId: company.id,
      isSuperMaster: false,
      isMaster: false,
      isCompanyMaster: false,
      isLite: true,
      role: 'operator_lite',
      operatorData: op
    };

    return success(res, { user, company });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 3. EMPRESAS (COMPANIES)
// ==========================================================================
app.get('/api/companies', async (req, res) => {
  try {
    const result = await query('SELECT * FROM companies ORDER BY created_at DESC');
    const companies = result.rows.map(r => ({ ...r.data, id: r.id, name: r.name, code: r.code, nit: r.nit, email: r.email, phone: r.phone }));
    return success(res, companies);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `EMP-${Date.now()}`;
    const name = data.name || 'Empresa Sin Nombre';
    const code = data.code || data.companyCode || `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const nit = data.nit || '';
    const email = data.email || '';
    const phone = data.phone || data.whatsapp || '';

    const payload = { ...data, id, name, code, nit, email, phone };
    await query(
      `INSERT INTO companies (id, name, code, nit, email, phone, data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = $2, code = $3, nit = $4, email = $5, phone = $6, data = $7, updated_at = NOW()`,
      [id, name, code, nit, email, phone, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const name = data.name || 'Empresa';
    const code = data.code || data.companyCode || '';
    const nit = data.nit || '';
    const email = data.email || '';
    const phone = data.phone || data.whatsapp || '';

    const payload = { ...data, id, name, code, nit, email, phone };
    await query(
      `UPDATE companies SET name = $2, code = $3, nit = $4, email = $5, phone = $6, data = $7, updated_at = NOW() WHERE id = $1`,
      [id, name, code, nit, email, phone, JSON.stringify(payload)]
    );

    return success(res, payload);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM companies WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 4. OPERARIOS (OPERATORS)
// ==========================================================================
app.get('/api/operators', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM operators';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const operators = result.rows.map(r => ({ ...r.data, id: r.id, name: r.name, code: r.code, companyId: r.company_id }));
    return success(res, operators);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/operators', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `OP-${Date.now()}`;
    const companyId = data.companyId || '';
    const name = data.name || 'Operario';
    const code = data.code || `OP-${Math.floor(100 + Math.random() * 900)}`;
    const pin = data.pin || data.password || '123456';

    const payload = { ...data, id, companyId, name, code, pin };
    await query(
      `INSERT INTO operators (id, company_id, name, code, pin, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET company_id = $2, name = $3, code = $4, pin = $5, data = $6`,
      [id, companyId, name, code, pin, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/operators/batch', async (req, res) => {
  try {
    const { companyId, operators = [] } = req.body;
    if (!companyId) return error(res, 'companyId requerido');

    for (const op of operators) {
      const id = op.id || `OP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const name = op.name || 'Operario';
      const code = op.code || `OP-${Math.floor(100 + Math.random() * 900)}`;
      const pin = op.pin || op.password || '123456';
      const payload = { ...op, id, companyId, name, code, pin };

      await query(
        `INSERT INTO operators (id, company_id, name, code, pin, data)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET company_id = $2, name = $3, code = $4, pin = $5, data = $6`,
        [id, companyId, name, code, pin, JSON.stringify(payload)]
      );
    }

    return success(res, { count: operators.length, success: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM operators WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 5. ÓRDENES DE PRODUCCIÓN (ORDERS)
// ==========================================================================
app.get('/api/orders', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM orders';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const orders = result.rows.map(r => ({ ...r.data, id: r.id, companyId: r.company_id, code: r.code, status: r.status }));
    return success(res, orders);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `ORD-${Date.now()}`;
    const companyId = data.companyId || '';
    const code = data.code || `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const status = data.status || 'Pendiente';

    const payload = { ...data, id, companyId, code, status };
    await query(
      `INSERT INTO orders (id, company_id, code, status, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET company_id = $2, code = $3, status = $4, data = $5, updated_at = NOW()`,
      [id, companyId, code, status, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const status = data.status || 'En Proceso';
    const payload = { ...data, id };

    await query(
      `UPDATE orders SET status = $2, data = $3, updated_at = NOW() WHERE id = $1`,
      [id, status, JSON.stringify(payload)]
    );

    return success(res, payload);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM orders WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 6. INVENTARIOS (ITEMS Y CONTEOS FÍSICOS)
// ==========================================================================
app.get('/api/inventory', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM inventory_items';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const items = result.rows.map(r => ({ ...r.data, id: r.id, companyId: r.company_id, code: r.code, name: r.name }));
    return success(res, items);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `INS-${Date.now()}`;
    const companyId = data.companyId || '';
    const code = data.code || id;
    const name = data.name || 'Insumo';

    const payload = { ...data, id, companyId, code, name };
    await query(
      `INSERT INTO inventory_items (id, company_id, code, name, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET company_id = $2, code = $3, name = $4, data = $5`,
      [id, companyId, code, name, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM inventory_items WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Conteos Físicos
app.get('/api/physical-inventories', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM physical_inventories';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const physicals = result.rows.map(r => ({ ...r.data, id: r.id, companyId: r.company_id, code: r.code }));
    return success(res, physicals);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/physical-inventories', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `INV-${Date.now()}`;
    const companyId = data.companyId || '';
    const code = data.code || `INV-${Math.floor(100 + Math.random() * 900)}`;

    const payload = { ...data, id, companyId, code };
    await query(
      `INSERT INTO physical_inventories (id, company_id, code, data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET company_id = $2, code = $3, data = $4`,
      [id, companyId, code, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 7. PLANTILLAS DE PROCESOS (PROCESS TEMPLATES)
// ==========================================================================
app.get('/api/process-templates', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM process_templates';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const templates = result.rows.map(r => ({ ...r.data, id: r.id, companyId: r.company_id, name: r.name }));
    return success(res, templates);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/process-templates', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `TPL-${Date.now()}`;
    const companyId = data.companyId || '';
    const name = data.name || 'Plantilla';

    const payload = { ...data, id, companyId, name };
    await query(
      `INSERT INTO process_templates (id, company_id, name, data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET company_id = $2, name = $3, data = $4`,
      [id, companyId, name, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/process-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM process_templates WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// ==========================================================================
// 8. REPORTES DE BAJAS Y DESPERDICIOS (WASTE REPORTS CON FOTO PERICIAL)
// ==========================================================================
app.get('/api/waste-reports', async (req, res) => {
  try {
    const { companyId } = req.query;
    let queryText = 'SELECT * FROM waste_reports';
    const params = [];
    if (companyId) {
      queryText += ' WHERE company_id = $1';
      params.push(companyId);
    }
    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    const reports = result.rows.map(r => ({
      ...r.data,
      id: r.id,
      companyId: r.company_id,
      code: r.code,
      itemName: r.item_name,
      quantity: r.quantity,
      unit: r.unit,
      reason: r.reason,
      responsible: r.responsible,
      date: r.date,
      time: r.time
    }));
    return success(res, reports);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.post('/api/waste-reports', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `WASTE-${Date.now()}`;
    const companyId = data.companyId || '';
    const code = data.code || `MERMA-${Math.floor(100 + Math.random() * 900)}`;
    const itemName = data.itemName || 'Insumo';
    const quantity = parseFloat(data.quantity || 0);
    const unit = data.unit || 'Kg';
    const reason = data.reason || 'Desperdicio';
    const responsible = data.responsible || 'Operario';
    const date = data.date || new Date().toISOString().split('T')[0];
    const time = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = { ...data, id, companyId, code, itemName, quantity, unit, reason, responsible, date, time };
    await query(
      `INSERT INTO waste_reports (id, company_id, code, item_name, quantity, unit, reason, responsible, date, time, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET 
         company_id = $2, code = $3, item_name = $4, quantity = $5, unit = $6, reason = $7, responsible = $8, date = $9, time = $10, data = $11`,
      [id, companyId, code, itemName, quantity, unit, reason, responsible, date, time, JSON.stringify(payload)]
    );

    return success(res, payload, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

app.delete('/api/waste-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM waste_reports WHERE id = $1', [id]);
    return success(res, { deleted: true, id });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Iniciar Servidor
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [DC Procesos Backend] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
});

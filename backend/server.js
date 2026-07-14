const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seedData = require('./seedData.json');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.env'));

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const requireProductionEnv = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (isProduction && (value === undefined || value === '')) {
    throw new Error(`${key} environment variable is required in production`);
  }
  return value;
};

const envValue = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
};

const requireAnyProductionEnv = (label, keys, fallback) => {
  const value = envValue(...keys) ?? fallback;
  if (isProduction && (value === undefined || value === '')) {
    throw new Error(`${label} environment variable is required in production. Set one of: ${keys.join(', ')}`);
  }
  return value;
};

const app = express();
const port = Number(process.env.PORT || 5000);
const uploadDir = path.join(__dirname, 'uploads');
const AUTH_SECRET = requireProductionEnv('AUTH_SECRET', 'change-this-local-dev-secret');
const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 12;
const adminEventClients = new Set();
const clientOrigins = (requireProductionEnv('CLIENT_URL', '') || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const vercelProjectPrefix = process.env.VERCEL_PROJECT_PREFIX || 'projectricebowl';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowAnyDevOrigin = !isProduction && clientOrigins.length === 0;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowAnyDevOrigin) return true;
  if (clientOrigins.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);

    if (
      protocol === 'https:' &&
      hostname.endsWith('.vercel.app') &&
      (hostname === `${vercelProjectPrefix}.vercel.app` || hostname.startsWith(`${vercelProjectPrefix}-`))
    ) {
      return true;
    }

    return clientOrigins.some(allowedOrigin => {
      if (!allowedOrigin.includes('*')) return false;
      const pattern = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    });
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, callback) {
    return callback(null, isAllowedOrigin(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: process.env.JSON_LIMIT || '10mb' }));
app.use('/uploads', express.static(uploadDir));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'couple-bowl-api' });
});

const saveDataUrlImage = (value, folder) => {
  if (!value || typeof value !== 'string' || !value.startsWith('data:image/')) {
    return value || null;
  }

  const match = value.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1].replace('+xml', '');
  const safeExt = ['jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'png';
  const targetDir = path.join(uploadDir, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;
  const targetPath = path.join(targetDir, filename);
  fs.writeFileSync(targetPath, Buffer.from(match[2], 'base64'));
  return `/uploads/${folder}/${filename}`;
};

const base64Url = (value) => Buffer.from(value).toString('base64url');
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash = '') => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
};

const createToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + TOKEN_MAX_AGE_MS
  };
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  req.authUser = user;
  next();
};

const requireRole = (role) => (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.authUser.role !== role) return res.status(403).json({ message: 'Access denied' });
    next();
  });
};

const requireAdmin = requireRole('admin');
const requireUserOrAdmin = (req, res, next) => requireAuth(req, res, next);

const sendAdminEvent = (event, data) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  adminEventClients.forEach(client => client.write(payload));
};

const dbConfig = {
  host: requireAnyProductionEnv('Database host', ['DB_HOST', 'MYSQLHOST']),
  port: Number(envValue('DB_PORT', 'MYSQLPORT') || 3306),
  user: requireAnyProductionEnv('Database user', ['DB_USER', 'MYSQLUSER'], 'root'),
  password: requireAnyProductionEnv('Database password', ['DB_PASSWORD', 'MYSQLPASSWORD'], ''),
  database: requireAnyProductionEnv('Database name', ['DB_NAME', 'MYSQLDATABASE'], 'rendiweb_db')
};

const db = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } } : {}),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) { console.error('Error connecting to MySQL:', err); return; }
  connection.release();
  console.log('Connected to MySQL database!');
});

const queryAsync = (sql, values = []) => db.promise().query(sql, values);

const ensureCoreTables = async () => {
  await queryAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(80) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      icon VARCHAR(80) DEFAULT 'Utensils',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      description TEXT,
      price INT NOT NULL DEFAULT 0,
      original_price INT NULL,
      image TEXT,
      category_id VARCHAR(80),
      is_popular TINYINT(1) DEFAULT 0,
      is_new TINYINT(1) DEFAULT 0,
      prep_time VARCHAR(50) DEFAULT '10 min',
      status VARCHAR(50) DEFAULT 'Tersedia',
      tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      phone VARCHAR(50),
      total_orders INT DEFAULT 0,
      total_spent INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INT,
      customer_name VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(50),
      address TEXT,
      note TEXT,
      payment_method VARCHAR(50),
      total INT NOT NULL DEFAULT 0,
      status VARCHAR(80) DEFAULT 'Diproses',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      menu_item_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price INT NOT NULL DEFAULT 0,
      item_note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      amount INT NOT NULL DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Pending',
      proof_image TEXT NULL,
      rejection_reason TEXT NULL,
      verified_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS promos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      type VARCHAR(50) DEFAULT 'percent',
      discount_percent INT DEFAULT 0,
      discount_nominal INT DEFAULT 0,
      min_purchase INT DEFAULT 0,
      start_date DATE NULL,
      end_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      type VARCHAR(80) DEFAULT 'food',
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(150) NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(120) UNIQUE NOT NULL,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const seedInitialMenu = async () => {
  const [categoryRows] = await queryAsync('SELECT COUNT(*) AS total FROM categories');
  if ((categoryRows[0]?.total || 0) === 0) {
    const values = seedData.categories.map(category => [category.id, category.name, category.icon || 'Utensils']);
    if (values.length > 0) {
      await queryAsync('INSERT INTO categories (id, name, icon) VALUES ?', [values]);
      console.log(`Seeded ${values.length} categories`);
    }
  }

  const [menuRows] = await queryAsync('SELECT COUNT(*) AS total FROM menu_items');
  if ((menuRows[0]?.total || 0) === 0) {
    const values = seedData.menuItems.map(item => [
      item.id,
      item.name,
      item.description,
      item.price,
      item.original_price,
      item.image,
      item.category_id,
      item.is_popular ? 1 : 0,
      item.is_new ? 1 : 0,
      item.prep_time || '10 min',
      item.status || 'Tersedia',
      item.tags || ''
    ]);

    if (values.length > 0) {
      await queryAsync(
        `INSERT INTO menu_items
          (id, name, description, price, original_price, image, category_id, is_popular, is_new, prep_time, status, tags)
         VALUES ?`,
        [values]
      );
      console.log(`Seeded ${values.length} menu items`);
    }
  }
};

const ensureColumn = (tableName, columnName, definition) => {
  const query = `
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `;

  db.query(query, [tableName, columnName], (err, rows) => {
    if (err) {
      console.error(`Failed checking ${tableName}.${columnName}:`, err.message);
      return;
    }

    if (rows[0]?.total > 0) return;

    db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`, (alterErr) => {
      if (alterErr) {
        console.error(`Failed adding ${tableName}.${columnName}:`, alterErr.message);
      } else {
        console.log(`Added missing column ${tableName}.${columnName}`);
      }
    });
  });
};

const normalizeMenuNames = () => {
  const updates = [
    {
      from: 'Ayam Suwir Pedas Rice Bowl',
      to: 'Ayam Suwir Rice Bowl',
      description: 'Shredded chicken cooked in rich authentic Indonesian seasoning',
      tags: 'Indonesian,Best Seller'
    },
    {
      from: 'Nasi Bom Merah (Pedas)',
      to: 'Nasi Bom Merah',
      description: 'Flavorful red seasoned jasmine rice',
      tags: 'Seasoned Rice,Hot'
    }
  ];

  updates.forEach(item => {
    db.query(
      'UPDATE menu_items SET name = ?, description = ?, tags = ? WHERE name = ?',
      [item.to, item.description, item.tags, item.from],
      (err) => {
        if (err) console.error(`Failed normalizing menu name ${item.from}:`, err.message);
      }
    );
  });
};

const ensureAuthUsers = () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS auth_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTable, (err) => {
    if (err) {
      console.error('Failed creating auth_users:', err.message);
      return;
    }

    const defaults = [
      { name: 'Admin Couple Bowl', email: 'admin@couplebowl.com', password: 'admin', role: 'admin' },
      { name: 'Alex Thompson', email: 'alex.t@email.com', password: 'user123', role: 'user' }
    ];

    defaults.forEach(user => {
      db.query('SELECT id FROM auth_users WHERE email = ?', [user.email], (findErr, rows) => {
        if (findErr || rows.length > 0) return;
        db.query(
          'INSERT INTO auth_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, hashPassword(user.password), user.role],
          (insertErr) => {
            if (insertErr) console.error(`Failed seeding auth user ${user.email}:`, insertErr.message);
          }
        );
      });
    });
  });
};

const bootstrapDatabase = async () => {
  try {
    await ensureCoreTables();
    await seedInitialMenu();
    ensureColumn('order_items', 'item_note', 'TEXT NULL');
    ensureColumn('payments', 'rejection_reason', 'TEXT NULL');
    normalizeMenuNames();
    ensureAuthUsers();
    console.log('Database bootstrap completed');
  } catch (err) {
    console.error('Database bootstrap failed:', err.message);
  }
};

bootstrapDatabase();

app.post('/api/auth/login', (req, res) => {
  const { email, password, expectedRole } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  db.query('SELECT * FROM auth_users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json(err);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message: expectedRole === 'admin'
          ? 'Akun ini bukan akun admin.'
          : 'Akun admin hanya bisa masuk lewat halaman admin.'
      });
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ user: sessionUser, token: createToken(sessionUser) });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });

  db.query(
    'INSERT INTO auth_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hashPassword(password), 'user'],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email sudah terdaftar' });
        return res.status(500).json(err);
      }

      const sessionUser = { id: result.insertId, name, email, role: 'user' };
      res.status(201).json({ user: sessionUser, token: createToken(sessionUser) });
    }
  );
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and new password are required' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password minimal 6 karakter' });

  db.query('SELECT * FROM auth_users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email tidak ditemukan' });
    }

    db.query(
      'UPDATE auth_users SET password_hash = ? WHERE email = ?',
      [hashPassword(password), email],
      (updateErr) => {
        if (updateErr) return res.status(500).json(updateErr);
        res.json({ success: true, message: 'Password berhasil diperbarui!' });
      }
    );
  });
});

app.get('/api/auth/session', requireAuth, (req, res) => {
  res.json({ user: req.authUser });
});

app.get('/api/events/admin', (req, res) => {
  const user = verifyToken(req.query.token);
  if (!user || user.role !== 'admin') return res.status(401).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  adminEventClients.add(res);
  req.on('close', () => {
    adminEventClients.delete(res);
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const { id, name, icon } = req.body;
  db.query('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)', [id, name, icon || 'Utensils'], (err) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id, name, icon });
  });
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const { name, icon } = req.body;
  db.query('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon || 'Utensils', req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Category updated' });
  });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Category deleted' });
  });
});

// Menu Items
app.get('/api/menu', (req, res) => {
  db.query('SELECT * FROM menu_items', (err, results) => {
    if (err) return res.status(500).json(err);
    const formatted = results.map(item => ({
      ...item,
      isPopular: item.is_popular === 1,
      isNew: item.is_new === 1,
      tags: item.tags ? item.tags.split(',') : []
    }));
    res.json(formatted);
  });
});

app.post('/api/menu', requireAdmin, (req, res) => {
  const { name, description, price, original_price, image, category_id, is_popular, is_new, prep_time } = req.body;
  const storedImage = saveDataUrlImage(image, 'menu');
  const query = `INSERT INTO menu_items (name, description, price, original_price, image, category_id, is_popular, is_new, prep_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tersedia')`;
  db.query(query, [name, description, price, original_price || null, storedImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', category_id, is_popular ? 1 : 0, is_new ? 1 : 0, prep_time || '10 min'], (err, results) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: results.insertId, ...req.body, image: storedImage });
  });
});

app.put('/api/menu/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, original_price, image, category_id, status } = req.body;
  const storedImage = saveDataUrlImage(image, 'menu');
  db.query(`UPDATE menu_items SET name=?, description=?, price=?, original_price=?, image=?, category_id=?, status=? WHERE id=?`,
    [name, description, price, original_price, storedImage || image, category_id, status || 'Tersedia', id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Menu updated' });
  });
});

app.delete('/api/menu/:id', requireAdmin, (req, res) => {
  db.query('DELETE FROM menu_items WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Menu deleted' });
  });
});

// Orders
app.get('/api/orders', requireAdmin, (req, res) => {
  const query = `
    SELECT
      o.*,
      p.id AS payment_id,
      p.status AS payment_status,
      p.proof_image,
      p.rejection_reason
    FROM \`orders\` o
    LEFT JOIN payments p ON p.order_id = o.id
    ORDER BY o.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
    if (results.length === 0) return res.json([]);

    const orderIds = results.map(order => order.id);
    const itemsQuery = `
      SELECT oi.*, mi.name, mi.image
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id IN (?)
      ORDER BY oi.id ASC
    `;

    db.query(itemsQuery, [orderIds], (itemsErr, items) => {
      if (itemsErr) return res.status(500).json({ message: 'Failed to fetch order items', error: itemsErr.message });

      const itemsByOrder = items.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});

      res.json(results.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || []
      })));
    });
  });
});

// Get orders for a specific user by email
app.get('/api/orders/user/:email', requireUserOrAdmin, (req, res) => {
  const { email } = req.params;
  if (req.authUser.role !== 'admin' && req.authUser.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  // Find customer by email first, then get their orders
  db.query('SELECT id FROM customers WHERE email = ?', [email], (err, customers) => {
    if (err) return res.status(500).json(err);
    if (customers.length === 0) return res.json([]);
    const customerId = customers[0].id;
    const ordersQuery = `
      SELECT
        o.*,
        p.status AS payment_status,
        p.proof_image,
        p.rejection_reason
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `;
    db.query(ordersQuery, [customerId], (err, orders) => {
      if (err) return res.status(500).json(err);
      // For each order, get its items
      if (orders.length === 0) return res.json([]);
      let completed = 0;
      orders.forEach((order, index) => {
        db.query('SELECT oi.*, mi.name, mi.image FROM order_items oi LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?', [order.id], (err, items) => {
          if (!err) {
            orders[index].items = items;
          }
          completed++;
          if (completed === orders.length) {
            res.json(orders);
          }
        });
      });
    });
  });
});

app.get('/api/orders/number/:orderNumber', requireUserOrAdmin, (req, res) => {
  const { orderNumber } = req.params;
  const orderQuery = `
    SELECT
      o.*,
      c.email AS customer_email,
      p.id AS payment_id,
      p.status AS payment_status,
      p.proof_image,
      p.rejection_reason,
      p.verified_at
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.order_number = ?
    LIMIT 1
  `;

  db.query(orderQuery, [orderNumber], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = rows[0];
    if (req.authUser.role !== 'admin' && String(order.customer_email || '').toLowerCase() !== req.authUser.email.toLowerCase()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.query(
      'SELECT oi.*, mi.name, mi.image FROM order_items oi LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = ? ORDER BY oi.id ASC',
      [order.id],
      (itemsErr, items) => {
        if (itemsErr) return res.status(500).json(itemsErr);
        res.json({ ...order, items });
      }
    );
  });
});

// Create new order from frontend checkout
app.post('/api/orders', requireUserOrAdmin, (req, res) => {
  const { customer_name, customer_email, customer_phone, address, note, payment_method, total, items, proof_image } = req.body;
  const storedProofImage = saveDataUrlImage(proof_image, 'payments');

  if (req.authUser.role !== 'admin' && req.authUser.email.toLowerCase() !== String(customer_email || '').toLowerCase()) {
    return res.status(403).json({ message: 'Order email does not match logged in user' });
  }
  
  // Generate unique order number
  const orderNumber = 'CB-' + Math.floor(1000 + Math.random() * 9000);
  
  // Determine initial status based on payment method
  const initialStatus = ['transfer', 'gopay'].includes(payment_method) ? 'Menunggu Pembayaran' : 'Diproses';

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  const rollback = (connection, err) => {
    connection.rollback(() => {
      connection.release();
      res.status(500).json(err);
    });
  };

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json(err);

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json(err);
      }

      const finishOrder = (customerId) => {
        const orderQuery = `INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, address, note, payment_method, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        connection.query(orderQuery, [orderNumber, customerId, customer_name, customer_phone || '', address || '', note || '', payment_method, total, initialStatus], (err, orderResult) => {
          if (err) return rollback(connection, err);

          const orderId = orderResult.insertId;
          const itemValues = items.map(item => [orderId, item.id, item.quantity, item.price, item.note || item.item_note || '']);
          const itemQuery = 'INSERT INTO order_items (order_id, menu_item_id, quantity, price, item_note) VALUES ?';

          connection.query(itemQuery, [itemValues], (err) => {
            if (err) return rollback(connection, err);

            const savePayment = (next) => {
              if (!['transfer', 'gopay'].includes(payment_method)) return next();

              const paymentQuery = 'INSERT INTO payments (order_id, amount, status, proof_image) VALUES (?, ?, ?, ?)';
              connection.query(paymentQuery, [orderId, total, 'Pending', storedProofImage || null], next);
            };

            savePayment((err) => {
              if (err) return rollback(connection, err);

              connection.query('UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?', [total, customerId], (err) => {
                if (err) return rollback(connection, err);

                connection.commit((err) => {
                  if (err) return rollback(connection, err);

                  connection.release();
                  sendAdminEvent('new-order', {
                    id: orderId,
                    order_number: orderNumber,
                    customer_name,
                    status: initialStatus,
                    total
                  });
                  res.status(201).json({
                    id: orderId,
                    order_number: orderNumber,
                    status: initialStatus,
                    total,
                    customer_name,
                    created_at: new Date().toISOString()
                  });
                });
              });
            });
          });
        });
      };

      connection.query('SELECT id FROM customers WHERE email = ?', [customer_email], (err, existing) => {
        if (err) return rollback(connection, err);

        if (existing.length > 0) {
          finishOrder(existing[0].id);
          return;
        }

        connection.query('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [customer_name, customer_email, customer_phone || ''], (err, customerResult) => {
          if (err) return rollback(connection, err);
          finishOrder(customerResult.insertId);
        });
      });
    });
  });
});

app.put('/api/orders/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) return res.status(500).json(err);
    sendAdminEvent('order-status-updated', { id, status });
    res.json({ message: 'Order status updated' });
  });
});


// Customers
app.get('/api/customers', requireAdmin, (req, res) => {
  db.query('SELECT * FROM customers ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Promos
app.get('/api/promos', (req, res) => {
  db.query('SELECT * FROM promos ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/promos', requireAdmin, (req, res) => {
  const { name, type, discount_percent, discount_nominal, min_purchase, start_date, end_date, code } = req.body;
  const query = 'INSERT INTO promos (name, type, discount_percent, discount_nominal, min_purchase, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
  db.query(query, [name, type, discount_percent || 0, discount_nominal || 0, min_purchase || 0, start_date, end_date], (err, results) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: results.insertId, ...req.body });
  });
});

app.delete('/api/promos/:id', requireAdmin, (req, res) => {
  db.query('DELETE FROM promos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Promo deleted' });
  });
});

// Payments
app.get('/api/payments', requireAdmin, (req, res) => {
  db.query('SELECT p.*, o.order_number, o.payment_method FROM payments p LEFT JOIN orders o ON p.order_id = o.id ORDER BY p.created_at DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.put('/api/payments/:id', requireAdmin, (req, res) => {
  const { status, rejection_reason } = req.body;
  db.query(
    'UPDATE payments SET status = ?, verified_at = ?, rejection_reason = ? WHERE id = ?',
    [status, status === 'Verified' ? new Date() : null, status === 'Rejected' ? (rejection_reason || '') : null, req.params.id],
    (err) => {
    if (err) return res.status(500).json(err);

    if (status === 'Rejected') {
      return db.query(
        'UPDATE orders o JOIN payments p ON p.order_id = o.id SET o.status = ? WHERE p.id = ?',
        ['Menunggu Pembayaran', req.params.id],
        (orderErr) => {
          if (orderErr) return res.status(500).json(orderErr);
          sendAdminEvent('payment-rejected', { payment_id: req.params.id });
          res.json({ message: 'Payment rejected' });
        }
      );
    }

    if (status !== 'Verified') {
      return res.json({ message: 'Payment status updated' });
    }

    db.query(
      'UPDATE orders o JOIN payments p ON p.order_id = o.id SET o.status = ? WHERE p.id = ?',
      ['Diproses', req.params.id],
      (err) => {
        if (err) return res.status(500).json(err);
        sendAdminEvent('payment-verified', { payment_id: req.params.id });
        res.json({ message: 'Payment verified and order updated' });
      }
    );
  });
});

// Gallery
app.get('/api/gallery', (req, res) => {
  db.query('SELECT * FROM gallery ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/gallery', requireAdmin, (req, res) => {
  const { title, type, image_url } = req.body;
  db.query('INSERT INTO gallery (title, type, image_url) VALUES (?, ?, ?)', [title || 'Gallery Image', type || 'food', image_url], (err, results) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: results.insertId, title, type, image_url });
  });
});

app.delete('/api/gallery/:id', requireAdmin, (req, res) => {
  db.query('DELETE FROM gallery WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Gallery item deleted' });
  });
});

// Testimonials
app.get('/api/testimonials', (req, res) => {
  db.query('SELECT * FROM testimonials ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/testimonials', (req, res) => {
  const { customer_name, rating, comment } = req.body;
  db.query('INSERT INTO testimonials (customer_name, rating, comment) VALUES (?, ?, ?)', [customer_name, rating, comment], (err, results) => {
    if (err) return res.status(500).json(err);
    res.status(201).json({ id: results.insertId, customer_name, rating, comment });
  });
});

app.delete('/api/testimonials/:id', requireAdmin, (req, res) => {
  db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Testimonial deleted' });
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  db.query('SELECT * FROM settings', (err, results) => {
    if (err) return res.status(500).json(err);
    // Convert array key-value to single object
    const settingsObj = {};
    results.forEach(row => {
      settingsObj[row.setting_key] = row.setting_value;
    });
    res.json(settingsObj);
  });
});

app.post('/api/settings', requireAdmin, (req, res) => {
  const settings = req.body;
  const promises = Object.keys(settings).map(key => {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, settings[key], settings[key]], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  Promise.all(promises)
    .then(() => res.json({ message: 'Settings updated' }))
    .catch(err => res.status(500).json(err));
});

// Stats
app.get('/api/stats', requireAdmin, (req, res) => {
  const stats = {};
  db.query('SELECT COUNT(*) as total FROM menu_items', (err, r1) => {
    if(err) return res.status(500).json(err);
    stats.totalMenu = r1[0].total;
    db.query('SELECT COUNT(*) as total FROM orders', (err, r2) => {
      if(err) return res.status(500).json(err);
      stats.totalOrders = r2[0].total;
      db.query('SELECT COUNT(*) as total FROM customers', (err, r3) => {
        if(err) return res.status(500).json(err);
        stats.totalCustomers = r3[0].total;
        db.query('SELECT SUM(total) as revenue FROM orders WHERE status = "Selesai"', (err, r4) => {
          if(err) return res.status(500).json(err);
          stats.totalRevenue = r4[0].revenue || 0;
          res.json(stats);
        });
      });
    });
  });
});

app.get('/api/dashboard', requireAdmin, (req, res) => {
  const stats = {};

  const queries = {
    statusCounts: `
      SELECT status, COUNT(*) AS total, COALESCE(SUM(total), 0) AS amount
      FROM orders
      GROUP BY status
    `,
    pendingPayments: `
      SELECT COUNT(*) AS total
      FROM payments
      WHERE status = 'Pending'
    `,
    revenueToday: `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM orders
      WHERE DATE(created_at) = CURDATE()
        AND status = 'Selesai'
    `,
    revenueMonth: `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM orders
      WHERE YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
        AND status = 'Selesai'
    `,
    weeklySales: `
      SELECT DATE(created_at) AS order_date, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY order_date ASC
    `,
    topMenu: `
      SELECT
        mi.id,
        mi.name,
        mi.image,
        COALESCE(SUM(oi.quantity), 0) AS sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'Dibatalkan'
      GROUP BY mi.id, mi.name, mi.image
      ORDER BY sold DESC, revenue DESC
      LIMIT 5
    `,
    recentOrders: `
      SELECT order_number, customer_name, total, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `,
  };

  db.query(queries.statusCounts, (err, statusCounts) => {
    if (err) return res.status(500).json(err);
    stats.statusCounts = statusCounts;

    db.query(queries.pendingPayments, (err, pendingPayments) => {
      if (err) return res.status(500).json(err);
      stats.pendingPayments = pendingPayments[0]?.total || 0;

      db.query(queries.revenueToday, (err, revenueToday) => {
        if (err) return res.status(500).json(err);
        stats.revenueToday = Number(revenueToday[0]?.total || 0);

        db.query(queries.revenueMonth, (err, revenueMonth) => {
          if (err) return res.status(500).json(err);
          stats.revenueMonth = Number(revenueMonth[0]?.total || 0);

          db.query(queries.weeklySales, (err, weeklySales) => {
            if (err) return res.status(500).json(err);
            stats.weeklySales = weeklySales;

            db.query(queries.topMenu, (err, topMenu) => {
              if (err) return res.status(500).json(err);
              stats.topMenu = topMenu;

              db.query(queries.recentOrders, (err, recentOrders) => {
                if (err) return res.status(500).json(err);
                stats.recentOrders = recentOrders;
                res.json(stats);
              });
            });
          });
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

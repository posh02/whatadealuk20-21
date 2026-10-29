const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const cookieSession = require('cookie-session');
const { normalizeProductRow } = require('./lib/product-utils');
require('dotenv').config();

const app = express();
const rootDir = __dirname;
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
const associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'whatadealuk20-21';
const feedDir = path.resolve(process.env.FEED_DIR || path.join(rootDir, 'private-data'));
const feedFile = path.join(feedDir, 'products.csv');
const defaultCsvPath = path.join(rootDir, 'tv-deals.csv');

fs.mkdirSync(feedDir, { recursive: true });
if (!fs.existsSync(feedFile) && fs.existsSync(defaultCsvPath)) {
  fs.copyFileSync(defaultCsvPath, feedFile);
}

const upload = multer({ storage: multer.memoryStorage() });

app.set('trust proxy', Number(process.env.TRUST_PROXY || 0) ? 1 : false);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
  name: 'whatadeal_session',
  secret: process.env.SESSION_SECRET || 'change-me-for-production',
  httpOnly: true,
  sameSite: 'lax',
  secure: false
}));
app.use(express.static(rootDir, { index: false }));

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required.' });
}

function normalizeCsvRecords(rows) {
  return rows
    .filter((row) => row && Object.values(row).some((value) => typeof value === 'string' ? value.trim() : value !== undefined && value !== null))
    .map((row, index) => normalizeProductRow(row, index, associateTag))
    .filter((product) => product && Number.isFinite(product.price) && product.price >= 0);
}

function readProducts() {
  if (!fs.existsSync(feedFile)) {
    return [];
  }

  const csvText = fs.readFileSync(feedFile, 'utf8');
  if (!csvText.trim()) {
    return [];
  }

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  return normalizeCsvRecords(rows);
}

function writeProducts(products) {
  const header = ['name', 'category', 'retailer', 'price', 'wasPrice', 'image', 'affiliateUrl', 'asin'];
  const lines = [header.join(',')];

  for (const product of products) {
    const row = [
      product.name || '',
      product.category || '',
      product.retailer || '',
      Number(product.price || 0).toFixed(2),
      product.wasPrice ? Number(product.wasPrice).toFixed(2) : '',
      product.image || '',
      product.affiliateUrl || '',
      product.asin || ''
    ].map((value) => {
      const text = String(value ?? '').replace(/"/g, '""');
      return /[",\n]/.test(text) ? `"${text}"` : text;
    });

    lines.push(row.join(','));
  }

  fs.writeFileSync(feedFile, `${lines.join('\n')}\n`, 'utf8');
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'whatadealuk', timestamp: new Date().toISOString() });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.user), user: req.session?.user || null });
});

app.post('/api/admin/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (username === adminUser && password === adminPassword) {
    req.session = req.session || {};
    req.session.user = username;
    return res.json({ ok: true, user: username });
  }

  return res.status(401).json({ error: 'Incorrect username or password.' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json({
    count: products.length,
    products,
    source: fs.existsSync(feedFile) ? feedFile : 'none'
  });
});

app.post('/api/admin/feed', ensureAuthenticated, upload.single('feed'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }

  try {
    const csvText = req.file.buffer.toString('utf8');
    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    if (!rows.length) {
      return res.status(400).json({ error: 'The uploaded CSV is empty.' });
    }

    const products = normalizeCsvRecords(rows);
    if (!products.length) {
      return res.status(400).json({ error: 'The CSV does not contain valid product rows.' });
    }

    writeProducts(products);
    return res.json({
      ok: true,
      count: products.length,
      file: feedFile,
      message: `Published ${products.length} product rows.`
    });
  } catch (error) {
    return res.status(400).json({ error: `Could not parse the CSV: ${error.message}` });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/products-template.csv', (req, res) => {
  res.sendFile(path.join(rootDir, 'products-template.csv'));
});

app.get('/products-example.csv', (req, res) => {
  res.sendFile(path.join(rootDir, 'products-example.csv'));
});

app.get('/tv-deals.csv', (req, res) => {
  res.sendFile(path.join(rootDir, 'tv-deals.csv'));
});

app.use((error, req, res, next) => {
  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error.' });
  }
  return next();
});

if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Whatadeal.uk running on http://${host}:${port}`);
  });
}

module.exports = app;

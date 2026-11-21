import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, supabase } from '../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ML_ROOT = path.resolve(__dirname, '../../../ml');
const REPORT_PATH = path.join(ML_ROOT, 'outputs', 'evaluation_report.json');

const CATEGORIES = [
  'Pottery',
  'Wooden Crafts',
  'Jewellery',
  'Textiles',
  'Baskets',
  'Paintings'
];

const LOCATIONS = [
  'Jaipur',
  'Varanasi',
  'Channapatna',
  'Bankura',
  'Kutch',
  'Mysuru',
  'Moradabad',
  'Srinagar',
  'Madurai',
  'Kolkata'
];

const FESTIVALS = [
  'None',
  'Pongal / Makar Sankranti',
  'Holi',
  'Ugadi / Vishu',
  'Raksha Bandhan / Independence Day',
  'Ganesh Chaturthi / Onam',
  'Navratri / Durga Puja',
  'Diwali',
  'Christmas'
];

const FESTIVAL_BY_MONTH = {
  1: 'Pongal / Makar Sankranti',
  3: 'Holi',
  4: 'Ugadi / Vishu',
  8: 'Raksha Bandhan / Independence Day',
  9: 'Ganesh Chaturthi / Onam',
  10: 'Navratri / Durga Puja',
  11: 'Diwali',
  12: 'Christmas'
};

function normalizeCategory(category) {
  return String(category || '').trim().toLowerCase();
}

function toModelCategory(category) {
  const normalized = normalizeCategory(category);
  if (/potter|terracotta|ceramic/.test(normalized)) return 'Pottery';
  if (/wood|channapatna/.test(normalized)) return 'Wooden Crafts';
  if (/textile|handloom|silk/.test(normalized)) return 'Textiles';
  if (/jewel/.test(normalized)) return 'Jewellery';
  if (/basket|weav/.test(normalized)) return 'Baskets';
  if (/paint|pattachitra/.test(normalized)) return 'Paintings';
  return null;
}

export function isLiveDemandCategorySupported(category) {
  return Boolean(toModelCategory(category));
}

function mostCommonLocation(products) {
  const counts = new Map();
  for (const product of products || []) {
    const region = String(product.region || '').split(',')[0].trim();
    if (region) counts.set(region, (counts.get(region) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
}

function resolvePython() {
  const venvPython = path.join(ML_ROOT, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPython)) return venvPython;
  const unixVenv = path.join(ML_ROOT, '.venv', 'bin', 'python');
  if (fs.existsSync(unixVenv)) return unixVenv;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function runPredict(args) {
  return new Promise((resolve, reject) => {
    const python = resolvePython();
    const child = spawn(python, ['predict.py', ...args], {
      cwd: ML_ROOT,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('The ML prediction timed out.'));
    }, 25000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Unable to start the ML Python environment: ${error.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `ML predict exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('ML predict did not return valid JSON. Train the models first.'));
      }
    });
  });
}

export function readMlInsights() {
  if (!fs.existsSync(REPORT_PATH)) {
    const error = new Error(
      'ML models are not trained yet. From the ml folder run: python train.py'
    );
    error.status = 503;
    throw error;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const trendRows = report.trends?.categories || [];
  const clusters = report.segmentation?.cluster_profiles || {};

  return {
    available: true,
    source: 'ml/outputs/evaluation_report.json',
    disclaimer:
      report.disclaimer ||
      'Sample / synthetic data for KalaSetu ML development only. Predictions are not real market insights.',
    sampleNote:
      'These figures come from trained sample models, not live PostgreSQL sales.',
    demand: {
      testMetrics: report.demand?.test_metrics || null,
      demandCuts: report.demand?.demand_cuts || null
    },
    price: {
      testMetrics: report.price?.test_metrics || null
    },
    segmentation: {
      testMetrics: report.segmentation?.test_metrics || null,
      clusterProfiles: clusters
    },
    trends: {
      trendingCategories: report.trends?.trending_categories || [],
      decreasingCategories: report.trends?.decreasing_categories || [],
      categories: trendRows
    },
    options: {
      categories: CATEGORIES,
      locations: LOCATIONS,
      sizes: ['Small', 'Medium', 'Large'],
      festivals: FESTIVALS
    }
  };
}

export async function predictDemand(body = {}) {
  const festival = body.festival && body.festival !== 'None' ? String(body.festival) : 'None';
  return runPredict([
    'demand',
    '--category', String(body.category || 'Pottery'),
    '--location', String(body.location || 'Jaipur'),
    '--historical-units', String(Number(body.historicalUnits ?? 20)),
    '--views', String(Number(body.views ?? 200)),
    '--enquiries', String(Number(body.enquiries ?? 5)),
    '--month', String(Number(body.month ?? 11)),
    '--festival', festival
  ]);
}

export async function predictLiveDemand(category) {
  if (!isSupabaseConfigured()) {
    const error = new Error('Supabase is not configured.');
    error.status = 503;
    throw error;
  }

  const requestedCategory = normalizeCategory(category);
  if (!requestedCategory) {
    const error = new Error('Choose a craft category to estimate demand.');
    error.status = 400;
    throw error;
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from('market_insights_by_category')
    .select('*');

  if (categoryError) {
    throw new Error(`Could not read live category data: ${categoryError.message}`);
  }

  const categoryRow = (categoryRows || []).find(
    (row) => normalizeCategory(row.category) === requestedCategory
  );
  if (!categoryRow) {
    const error = new Error('The selected category was not found in live marketplace data.');
    error.status = 404;
    throw error;
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('region')
    .eq('category', categoryRow.category);

  if (productsError) {
    throw new Error(`Could not read live product regions: ${productsError.message}`);
  }

  const month = new Date().getUTCMonth() + 1;
  const modelCategory = toModelCategory(categoryRow.category);
  if (!modelCategory) {
    const error = new Error(
      `The demand model does not support the live category "${categoryRow.category}" yet.`
    );
    error.status = 422;
    throw error;
  }

  const location = mostCommonLocation(products);
  const liveInputs = {
    category: categoryRow.category,
    modelCategory,
    location,
    productViews30d: Number(categoryRow.views_30d) || 0,
    buyerEnquiries30d: Number(categoryRow.enquiries_30d) || 0,
    historicalUnitsSold: 0,
    month,
    festival: FESTIVAL_BY_MONTH[month] || 'None'
  };

  const prediction = await predictDemand({
    category: modelCategory,
    location,
    historicalUnits: liveInputs.historicalUnitsSold,
    views: liveInputs.productViews30d,
    enquiries: liveInputs.buyerEnquiries30d,
    month,
    festival: liveInputs.festival
  });

  return {
    model: 'demand_random_forest',
    source: 'Live Supabase product views and buyer enquiries',
    liveInputs,
    prediction,
    limitation:
      'The model is trained on sample data. KalaSetu has no sales-history table yet, so historicalUnitsSold is set to 0.'
  };
}

export async function predictPrice(body = {}) {
  const args = [
    'price',
    '--category', String(body.category || 'Textiles'),
    '--material', String(Number(body.material ?? 600)),
    '--labour', String(Number(body.labour ?? 1400)),
    '--size', String(body.size || 'Medium'),
    '--hours', String(Number(body.hours ?? 12))
  ];
  if (body.marketPrice !== undefined && body.marketPrice !== null && body.marketPrice !== '') {
    args.push('--market-price', String(Number(body.marketPrice)));
  }
  return runPredict(args);
}

export async function predictSegment(body = {}) {
  const categories = Array.isArray(body.categories)
    ? body.categories.join('|')
    : String(body.categories || '');
  return runPredict([
    'segment',
    '--purchases', String(Number(body.purchases ?? 10)),
    '--aov', String(Number(body.aov ?? 900)),
    '--frequency', String(Number(body.frequency ?? 4)),
    '--categories', categories
  ]);
}

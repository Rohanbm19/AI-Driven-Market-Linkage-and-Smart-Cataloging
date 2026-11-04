import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import artisansRouter from './routes/artisans.js';
import enquiriesRouter from './routes/enquiries.js';
import aiRouter from './routes/ai.js';
import marketRouter from './routes/market.js';
import { isSupabaseConfigured } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'KalaSetu Backend API',
    supabaseConnected: isSupabaseConfigured(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabaseConnected: isSupabaseConfigured() });
});

// Mount Routes
app.use('/api/products', productsRouter);
app.use('/api/artisans', artisansRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/market', marketRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 KalaSetu API Server running at: http://localhost:${PORT}`);
  console.log(`📡 Supabase Cloud Status: ${isSupabaseConfigured() ? 'Connected ✅' : 'Waiting for keys in .env 🟡'}`);
  console.log(`📦 Endpoints:`);
  console.log(`   - GET/POST/PUT/DELETE /api/products`);
  console.log(`   - GET/POST/PUT        /api/artisans`);
  console.log(`   - GET/POST/PATCH      /api/enquiries`);
  console.log(`   - POST                /api/ai/catalog`);
  console.log(`   - POST                /api/ai/pricing`);
  console.log(`   - GET                 /api/market/trends\n`);
});

export default app;

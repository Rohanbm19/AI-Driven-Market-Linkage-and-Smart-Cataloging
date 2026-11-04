# AI-Driven Market Linkage and Smart Cataloging

An end-to-end platform empowering rural and traditional artisans with smart AI cataloging, market linkage, multilingual conversational assistance, image enhancement, and automated enquiry management.

## Project Structure

```
frontend/                 React + Vite application
backend/                  Express API (ES modules)
    src/index.js             API startup and route registration
    src/routes/              Products, artisans, enquiries, AI, and market endpoints
    src/services/            Catalog, chat, image, and pricing logic
supabase/
    config.toml              Supabase CLI project configuration
    migrations/              Three basic table migrations, applied in filename order
    seed.sql                 Sample artisan and product data
    functions/               Optional Supabase Edge Functions
```

## Requirements

- Node.js 18 or newer
- A Supabase project for persistent database storage (optional for local fallback mode)

## Getting Started

### Supabase

Install the Supabase CLI dependency from the repository root, then link the project and apply the migrations:

```bash
npm install
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

To load the sample artisans and products, run `supabase/seed.sql` in the Supabase Dashboard SQL Editor after the migrations. The migrations create `artisans`, `products`, and `enquiries`; products link to artisans, and enquiries can link to products.

For the currently configured Supabase project, the existing `artisans` and `products` tables are empty and use an older schema. In the Supabase Dashboard SQL Editor, run `supabase/quick_setup.sql` first, then run `supabase/seed.sql`. The setup script drops and recreates those empty tables, so do not run it if you have added data you need to keep.

If these migrations have already been applied to a database, make schema changes in a new migration rather than editing an applied migration.

### Backend

In PowerShell, Command Prompt, or a Unix shell:

```bash
cd backend
npm ci
```

Create `backend/.env` and set:

```dotenv
PORT=5000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

The backend can use `SUPABASE_ANON_KEY` if no service-role key is provided. Keep service-role keys in the backend only; never put them in frontend environment variables. Start the API with:

```bash
npm run dev
```

The API listens at `http://localhost:5000`. `GET /api/health` reports whether Supabase credentials are configured; it does not verify a live database connection. Without credentials, product, artisan, and enquiry routes use in-memory sample data.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env` and set the Supabase project URL and public anon key if the frontend Supabase features are needed. The API URL defaults to `http://localhost:5000/api`.

```bash
npm run dev
```

## API Endpoints

- `GET`, `POST`, `PUT`, `DELETE /api/products`
- `GET`, `POST`, `PUT /api/artisans`
- `GET`, `POST`, `PATCH /api/enquiries`
- `POST /api/ai/catalog`, `/api/ai/chat`, `/api/ai/enhance-image`, `/api/ai/pricing`
- `GET /api/market/trends`

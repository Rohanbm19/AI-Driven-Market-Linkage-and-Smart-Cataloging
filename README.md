# KalaSetu – AI-Driven Market Linkage and Smart Cataloging

**Empowering Rural Artisans Through AI, Digital Market Access and Multilingual Technology**

KalaSetu is an AI-powered marketplace platform designed to connect rural and traditional artisans with potential customers. It simplifies product cataloging, improves product presentation, supports multilingual interactions, and helps artisans showcase their products in a digital marketplace.

The platform combines AI-assisted catalog generation, image enhancement, market insights and enquiry management to help artisans improve their online presence and reach wider markets.

> **Merged project documentation:** Start with [MERGE_NOTES.md](MERGE_NOTES.md) for authentication, database upgrades, artisan approval and additional setup instructions.

---

```
frontend/                 React + Vite application
backend/                  Express API (ES modules)
    src/index.js             API startup and route registration
    src/routes/              Products, artisans, enquiries, AI, and market endpoints
    src/services/            Catalog, chat, image, and pricing logic
    image_enhancer/           FastAPI + OpenCV image enhancement service
supabase/
    config.toml              Supabase CLI project configuration
    migrations/              Database migrations, applied in filename order
    seed.sql                 Sample artisan and product data
    functions/               Optional Supabase Edge Functions
ml/                          Model training module; live demand inference is served by the backend
```

## Project Structure

```text
AI-Driven-Market-Linkage-and-Smart-Cataloging/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── i18n/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   ├── image_enhancer/
│   └── package.json
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── config.toml
│   └── seed.sql
│
├── MERGE_NOTES.md
└── README.md
```

## Getting Started

### Requirements

- Node.js 18 or newer.
- npm.
- Python 3.10 or newer for the image enhancement service.
- A Supabase project.
- Google Gemini API key for AI-powered features.
- Supabase CLI for database migrations.

### 1. Clone the Repository

```bash
git clone https://github.com/Rohanbm19/AI-Driven-Market-Linkage-and-Smart-Cataloging.git

cd AI-Driven-Market-Linkage-and-Smart-Cataloging
```

### 2. Configure Supabase

Install dependencies from the repository root:

```bash
npm install
```

Log in and link your Supabase project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Apply database migrations:

**How Market Insights works:** The frontend requests summaries from the backend, which reads Supabase product listings, enquiries, and recorded product views. Database views calculate category prices and compare recent buyer activity with the previous 30 days. ML CSVs are used only to train models, not for live insights.

Apply `supabase/migrations/202611210002_market_insights_live_data.sql` after the products and enquiries tables exist. It creates the product-view table and summary views. Use `npx supabase db push` after linking the project, or run the migration file in the Supabase Dashboard SQL Editor. Product-view counts start after migration; existing listings and enquiries are analyzed immediately.

`supabase/quick_setup.sql` is a destructive development shortcut that drops and recreates tables. Do not run it against a database containing data; it can delete products, artisans, and enquiries. Prefer applying migrations to an existing project. Run `supabase/seed.sql` only when you intentionally want to add its sample records.

For additional authentication, database upgrade and artisan approval instructions, refer to [MERGE_NOTES.md](MERGE_NOTES.md).

**Important:** Review the migration instructions before applying schema changes to a database containing existing data. Do not run destructive setup scripts on a database with data you need to preserve.

### 3. Backend Setup

```bash
cd backend
npm ci
```

Create a `.env` file inside the backend directory.

Configure the required credentials:

```dotenv
PORT=5000

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=YOUR_SUPPORTED_GEMINI_MODEL
```

Keep private credentials in the backend environment only. Never expose the Supabase service-role key in frontend code or commit `.env` files to GitHub.

Start the backend:

```bash
npm run dev
```

Backend API:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/api/health
```

### 4. Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm ci
```

Create a `.env` file using the provided example:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

VITE_API_URL=http://localhost:5000/api
VITE_IMAGE_ENHANCER_URL=http://localhost:8000
```

Only use the public Supabase anon/publishable key in the frontend. Never use the service-role key here.

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### 5. OpenCV Image Enhancer Setup

The image enhancement service runs separately from the Express backend.

From the repository root:

```powershell
cd backend\image_enhancer

py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt

$env:IMAGE_ENHANCER_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Health endpoint:

```text
http://localhost:8000/health
```

Image enhancement endpoint:

```text
POST http://localhost:8000/api/enhance
```

For detailed image enhancement options and troubleshooting, see the [Image Enhancement](#image-enhancement) section.

## Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `PORT` | Backend | Express server port |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend | User authentication validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Server-side privileged database operations |
| `GEMINI_API_KEY` | Backend | Gemini AI integration |
| `GEMINI_MODEL` | Backend | Configured Gemini model |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public Supabase key |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_IMAGE_ENHANCER_URL` | Frontend | Image enhancement service URL |
| `IMAGE_ENHANCER_ALLOWED_ORIGINS` | Image service | Allowed frontend origins |

Use the `.env.example` files as templates wherever available. Never commit actual credentials.

### ML Training and Live Demand Estimates

The CSV datasets under `ml/datasets/` are training/evaluation samples; they are not imported into Supabase. Market Insights continues to calculate its listings, prices, views, and enquiries directly from live database records. Its optional **Estimate demand** control sends the selected category's live views and enquiries to the trained demand model through `GET /api/market/ml/demand?category=<database-category>`.

The API reads the category and its recent activity from Supabase, then invokes the model in `ml/`. The demand model currently supports pottery, woodwork, textiles, jewellery, baskets, and paintings; unsupported live categories return HTTP 422 rather than a misleading estimate. Training remains sample-based for now. KalaSetu does not yet store completed sales history, so the model's `historical_units_sold` input is explicitly set to zero; treat this output as exploratory, not a production forecast. The price and customer-segmentation models remain command-line tools until the app has reliable cost and purchase-history inputs.

In PowerShell, from the repository root:

```powershell
cd ml
.\.venv\Scripts\Activate.ps1
python train.py
python predict.py trends
```

If the ML virtual environment has not been created, set it up first:

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python train.py
```

Training saves model artifacts in `ml/models/` and evaluation reports in `ml/outputs/`. The backend uses `ml/.venv` when it exists; create it, install `ml/requirements.txt`, and run `python train.py` before using the live demand estimate. See [ml/README.md](ml/README.md) for setup and offline prediction commands.

## API Endpoints

- `GET`, `POST`, `PUT`, `DELETE /api/products`
- `GET`, `POST`, `PUT /api/artisans`
- `GET`, `POST`, `PATCH /api/enquiries`
- `POST /api/ai/catalog`, `/api/ai/chat`, `/api/ai/enhance-image`, `/api/ai/pricing`
- `GET /api/market/insights`, `/api/market/trends`
- `GET /api/market/ml/demand?category=<database-category>`
- `POST /api/market/products/:id/view`
- `POST http://localhost:8000/api/enhance` (FastAPI image service)

Supported features include:

- JPEG, PNG and WebP image uploads.
- Maximum upload size of 10 MB.
- Background presets:
  - `clean_white`
  - `warm_sand`
  - `soft_sage`
- Optional custom background images.
- Original image preservation.
- Before-and-after image comparison.

Example smoke test:

```powershell
Invoke-RestMethod http://localhost:8000/health

curl.exe -F "file=@C:\path\to\product.jpg" http://localhost:8000/api/enhance --output enhanced.jpg
```

The Add Product form and standalone `/image-enhancer` page provide image enhancement workflows. Review the result before accepting it.

If the frontend cannot reach the image service, verify that FastAPI is running, check the health endpoint and confirm that `VITE_IMAGE_ENHANCER_URL` and `IMAGE_ENHANCER_ALLOWED_ORIGINS` are configured correctly.

## Future Enhancements

- More regional language support.
- Improved AI-powered product recommendations.
- Advanced artisan analytics.
- Expanded market linkage opportunities.
- Enhanced marketplace discovery.
- Additional tools for artisan business growth.

## Contributors

Developed collaboratively as an AI-driven marketplace project focused on supporting rural and traditional artisans.

Contributions, suggestions and improvements are welcome.

---

**KalaSetu – Connecting Artisans to Opportunities.**
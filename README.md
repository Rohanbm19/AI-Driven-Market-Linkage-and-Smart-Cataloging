# Merged version

Start with [MERGE_NOTES.md](MERGE_NOTES.md) for authentication, database upgrade, artisan approval and run instructions. The original main README follows.

# AI-Driven Market Linkage and Smart Cataloging

An end-to-end platform empowering rural and traditional artisans with smart AI cataloging, market linkage, multilingual conversational assistance, image enhancement, and automated enquiry management.

## Project Structure

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

**How Market Insights works:** The frontend requests summaries from the backend, which reads Supabase product listings, enquiries, and recorded product views. Database views calculate category prices and compare recent buyer activity with the previous 30 days. ML CSVs are used only to train models, not for live insights.

Apply `supabase/migrations/202611210002_market_insights_live_data.sql` after the products and enquiries tables exist. It creates the product-view table and summary views. Use `npx supabase db push` after linking the project, or run the migration file in the Supabase Dashboard SQL Editor. Product-view counts start after migration; existing listings and enquiries are analyzed immediately.

`supabase/quick_setup.sql` is a destructive development shortcut that drops and recreates tables. Do not run it against a database containing data; it can delete products, artisans, and enquiries. Prefer applying migrations to an existing project. Run `supabase/seed.sql` only when you intentionally want to add its sample records.

If these migrations have already been applied to a database, make schema changes in a new migration rather than editing an applied migration.
The image enhancement workflow uses `products.original_image_url` to retain the original photo alongside the selected listing image. Apply the new migration with `npx supabase db push` before publishing enhanced images to Supabase.

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

### OpenCV Image Enhancer

Run the image service in a separate terminal. From the repository root in PowerShell:

```powershell
cd backend\image_enhancer
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:IMAGE_ENHANCER_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service accepts multipart image uploads at `POST http://localhost:8000/api/enhance`, limited to JPEG, PNG, and WebP files up to 10 MB. It returns the enhanced image bytes in the original format. Set the optional `background_preset` field to `clean_white`, `warm_sand`, or `soft_sage` to replace the original background, or send an optional `background_file` image to use a custom background. Omit the background fields or use `none` to keep the current background. Background removal works best when the product is centered and clearly separated from a simple background. `GET http://localhost:8000/health` checks service availability. Images are processed in an automatically cleaned temporary directory; the submitted file is never overwritten.

The Add Product form and standalone image enhancer let users choose a studio preset or upload a custom background before processing. Review the result before accepting it; the original photo remains unchanged.

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_IMAGE_ENHANCER_URL=http://localhost:8000` if the service is hosted elsewhere. Restart Vite after changing frontend environment variables. The browser sends the file directly to this service; configure `IMAGE_ENHANCER_ALLOWED_ORIGINS` to include the frontend origin when deploying.

If the frontend reports **“Could not reach the image enhancement service”**, start the FastAPI command above in its own terminal and leave it running while using the frontend. Check `http://localhost:8000/health`; it should return a JSON status of `ok`. If health works but enhancement still fails, make sure `VITE_IMAGE_ENHANCER_URL` points to that service and that `IMAGE_ENHANCER_ALLOWED_ORIGINS` includes the exact frontend origin (for example, `http://localhost:5173`). Restart the relevant service after changing environment variables.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.example` to `frontend/.env` and set the Supabase project URL and public anon key if the frontend Supabase features are needed. The API URL defaults to `http://localhost:5000/api`; the image enhancer URL defaults to `http://localhost:8000`.

```bash
npm run dev
```

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

### Image enhancement smoke test

With the FastAPI service running, verify its health and upload a local photo:

```powershell
Invoke-RestMethod http://localhost:8000/health
curl.exe -F "file=@C:\path\to\product.jpg" http://localhost:8000/api/enhance --output enhanced.jpg
```

Then open `http://localhost:5173/add-product`, upload an image, select **Enhance Image**, and use the before/after slider. Choose **Accept Enhanced Image** or **Keep Original Image** before publishing. The standalone `/image-enhancer` page also supports upload, comparison, retry, and download.

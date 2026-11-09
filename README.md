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

## API Endpoints

- `GET`, `POST`, `PUT`, `DELETE /api/products`
- `GET`, `POST`, `PUT /api/artisans`
- `GET`, `POST`, `PATCH /api/enquiries`
- `POST /api/ai/catalog`, `/api/ai/chat`, `/api/ai/enhance-image`, `/api/ai/pricing`
- `GET /api/market/trends`
- `POST http://localhost:8000/api/enhance` (FastAPI image service)

### Image enhancement smoke test

With the FastAPI service running, verify its health and upload a local photo:

```powershell
Invoke-RestMethod http://localhost:8000/health
curl.exe -F "file=@C:\path\to\product.jpg" http://localhost:8000/api/enhance --output enhanced.jpg
```

Then open `http://localhost:5173/add-product`, upload an image, select **Enhance Image**, and use the before/after slider. Choose **Accept Enhanced Image** or **Keep Original Image** before publishing. The standalone `/image-enhancer` page also supports upload, comparison, retry, and download.

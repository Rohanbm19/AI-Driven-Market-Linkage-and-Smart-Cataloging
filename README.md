# KalaSetu – AI-Driven Market Linkage and Smart Cataloging

**Empowering Rural Artisans Through AI, Digital Market Access and Multilingual Technology**

KalaSetu is an AI-powered marketplace platform designed to connect rural and traditional artisans with potential customers. It simplifies product cataloging, improves product presentation, supports multilingual interactions, and helps artisans showcase their products in a digital marketplace.

The platform combines AI-assisted catalog generation, image enhancement, market insights, demand prediction, pricing assistance, and enquiry management to help artisans improve their online presence and reach wider markets.

> **Merged project documentation:** Start with [MERGE_NOTES.md](MERGE_NOTES.md) for authentication, database upgrades, artisan approval, and additional setup instructions.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Image Enhancement](#image-enhancement)
- [Market Intelligence and ML](#market-intelligence-and-ml)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)

---

## Problem Statement

Many rural and traditional artisans face challenges when trying to sell their products online:

- Limited access to digital marketplaces.
- Difficulty creating attractive product descriptions and catalogs.
- Language barriers when using digital platforms.
- Lack of professional product photography.
- Limited access to market information.
- Difficulty managing customer enquiries.

These challenges reduce their visibility and opportunities to reach customers.

## Our Solution

KalaSetu provides a unified digital platform where artisans can register, showcase their products, generate product catalog content, enhance product images, and manage customer enquiries.

AI-assisted tools reduce the effort required to create professional product listings, while multilingual support makes the platform more accessible.

The platform also provides market insights and pricing assistance to help artisans make more informed business decisions.

---

## Key Features

### 1. AI-Powered Smart Cataloging

- Generate product descriptions and catalog content using AI.
- Assist artisans in creating structured product listings.
- Provide automatic suggestions for product information.
- Reduce manual effort during product registration.

### 2. Digital Marketplace

- Browse artisan products.
- Explore product details and listings.
- Connect buyers with artisans.
- Submit and manage product enquiries.

### 3. Multilingual Support

- Language-aware interface.
- Support for English, Kannada, Hindi, Tamil, Telugu, and Malayalam.
- Help users interact with the platform in their preferred language.

### 4. Product Image Enhancement

- Improve product presentation using image processing.
- Apply background presets.
- Upload custom backgrounds.
- Compare original and enhanced images before accepting changes.
- Preserve the original uploaded image.

### 5. Artisan Authentication and Approval

- Separate buyer and artisan authentication flows.
- Authenticated artisan access.
- Artisan profile and ownership management.
- Artisan approval workflow.

### 6. Market Insights and Pricing

- Access market trend information.
- Analyze product views and buyer enquiries.
- Generate demand forecasts using available marketplace data.
- Provide AI-assisted pricing support.
- Help artisans make more informed product listing decisions.

### 7. Conversational AI Assistance

- AI-powered conversational assistance.
- Help users with catalog-related queries.
- Support artisan workflows through AI services.

### 8. Enquiry Management

- Manage customer enquiries.
- Connect enquiries with products and artisans.
- Support enquiry status and response workflows.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Supabase |
| Authentication | Supabase Auth |
| AI Integration | Google Gemini |
| Image Processing | Python, FastAPI, OpenCV |
| Machine Learning | Python, scikit-learn, Pandas, NumPy |
| API Communication | REST APIs |
| Development Tools | Git, GitHub, Supabase CLI |

---

## Project Architecture

KalaSetu uses a modular architecture with separate frontend, backend, database, machine-learning, and image-processing components.

```text
                         USERS
                           |
                           v
                  React + Vite Frontend
                           |
                           v
                    Express Backend
                    /      |       \
                   /       |        \
                  v        v         v
             Supabase   Gemini AI   Market Intelligence
             Database                and ML Services
                |                         |
                v                         v
            PostgreSQL              Python ML Module
                                           |
                                           v
                                  Demand / Price /
                                  Customer Insights


                  React Frontend
                        |
                        v
                 FastAPI Service
                        |
                        v
                 OpenCV Processing
```

### Architecture Overview

- **Frontend:** Provides the user interface for buyers and artisans.
- **Backend:** Handles API requests, authentication-related workflows, business logic, and communication with external services.
- **Supabase:** Provides PostgreSQL database services and authentication.
- **Gemini AI:** Supports AI-assisted catalog generation and conversational assistance.
- **Python ML Module:** Provides demand prediction, price estimation, customer segmentation, and market trend analysis.
- **FastAPI and OpenCV:** Handle product image enhancement independently of the Express backend.

---

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
│   │   ├── main.py
│   │   └── requirements.txt
│   └── package.json
│
├── ml/
│   ├── train.py
│   ├── outputs/
│   └── requirements.txt
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
│
├── MERGE_NOTES.md
└── README.md
```

---

## Getting Started

### Requirements

- Node.js 18 or newer.
- npm.
- Python 3.10 or newer for Python services.
- A Supabase project.
- Google Gemini API key for AI-powered features.
- Supabase CLI for database migrations.

### 1. Clone the Repository

```bash
git clone https://github.com/Rohanbm19/AI-Driven-Market-Linkage-and-Smart-Cataloging.git

cd AI-Driven-Market-Linkage-and-Smart-Cataloging
```

### 2. Configure Supabase

Log in to Supabase:

```bash
npx supabase login
```

Link your Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Apply database migrations:

```bash
npx supabase db push
```

#### Market Insights Database Migration

Apply:

```text
supabase/migrations/202611210002_market_insights_live_data.sql
```

This migration should be applied after the products and enquiries tables exist.

It creates the product-view table and summary views used by the Market Insights functionality.

Alternatively, run the migration SQL in the Supabase Dashboard SQL Editor.

Important notes:

- Product-view counts begin accumulating after the migration is applied.
- Existing product listings and enquiries can be analyzed immediately.
- ML CSV files are used for model training and are not treated as live marketplace transactions.
- Review migration instructions before applying schema changes to a database containing existing data.

#### Database Safety

`supabase/quick_setup.sql` is a destructive development shortcut that drops and recreates tables.

**Do not run it against a database containing data you need to preserve.**

Prefer applying migrations to an existing project.

Run `supabase/seed.sql` only when you intentionally want to add its sample records.

For additional authentication, database upgrade, and artisan approval instructions, refer to [MERGE_NOTES.md](MERGE_NOTES.md).

### 3. Backend Setup

Open a terminal:

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

Keep private credentials in the backend environment only.

Never expose the Supabase service-role key in frontend code or commit `.env` files to GitHub.

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

Create a `.env` file inside the frontend directory:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

VITE_API_URL=http://localhost:5000/api
VITE_IMAGE_ENHANCER_URL=http://localhost:8000
```

Only use the public Supabase anon/publishable key in the frontend.

Never use the service-role key here.

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

### 6. Machine Learning Setup

The machine-learning module is maintained separately from the Express backend.

From the repository root:

```powershell
cd ml

py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt
```

Train the models:

```powershell
python train.py
```

The generated model artifacts and evaluation report are stored in the ML output directory.

**Important:** Synthetic or sample training data is used for ML development and evaluation. Predictions based on these datasets are exploratory and should not be presented as verified real-world marketplace insights.

---

## Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `PORT` | Backend | Express server port |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend | Authentication validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Server-side privileged database operations |
| `GEMINI_API_KEY` | Backend | Gemini AI integration |
| `GEMINI_MODEL` | Backend | Configured Gemini model |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public Supabase key |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_IMAGE_ENHANCER_URL` | Frontend | Image enhancement service URL |
| `IMAGE_ENHANCER_ALLOWED_ORIGINS` | Image service | Allowed frontend origins |

Use the `.env.example` files as templates wherever available.

Never commit actual credentials.

---

## API Endpoints

The following endpoints describe the main application API groups. Verify exact paths and HTTP methods against the corresponding backend route files.

### Products

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Artisans

- `GET /api/artisans`
- `POST /api/artisans`
- `PUT /api/artisans/:id`

### Enquiries

- `GET /api/enquiries`
- `POST /api/enquiries`
- `PATCH /api/enquiries/:id`

### AI Services

- `POST /api/ai/catalog`
- `POST /api/ai/chat`
- `POST /api/ai/enhance-image`
- `POST /api/ai/pricing`

### Market Insights and ML

- `GET /api/market/insights`
- `GET /api/market/trends`
- `GET /api/market/ml/demand?category=<database-category>`
- `GET /api/market/ml/insights`
- `GET /api/market/ml/trends`
- `POST /api/market/products/:id/view`
- `POST /api/market/fair-price`
- `POST /api/market/ml/demand`
- `POST /api/market/ml/price`
- `POST /api/market/ml/segment`

### Image Enhancement Service

- `GET http://localhost:8000/health`
- `POST http://localhost:8000/api/enhance`

Refer to the backend route files for the exact request parameters and response structures.

---

## Image Enhancement

KalaSetu uses a separate FastAPI service with OpenCV to improve product presentation.

Supported features include:

- JPEG, PNG, and WebP image uploads.
- Maximum upload size of 10 MB.
- Background presets:
  - `clean_white`
  - `warm_sand`
  - `soft_sage`
- Optional custom background images.
- Original image preservation.
- Before-and-after image comparison.

The Add Product form and standalone `/image-enhancer` page provide image enhancement workflows.

Review the enhanced result before accepting it.

If the frontend cannot reach the image service:

1. Verify that FastAPI is running.
2. Check the `/health` endpoint.
3. Confirm that `VITE_IMAGE_ENHANCER_URL` is configured correctly.
4. Confirm that `IMAGE_ENHANCER_ALLOWED_ORIGINS` includes the frontend origin.

Example smoke test:

```powershell
Invoke-RestMethod http://localhost:8000/health

curl.exe -F "file=@C:\path\to\product.jpg" http://localhost:8000/api/enhance --output enhanced.jpg
```

---

## Market Intelligence and ML

KalaSetu provides market intelligence through a combination of live marketplace data and exploratory machine-learning models.

### Live Market Insights

The live Market Insights functionality retrieves information from Supabase, including:

- Product listings.
- Recorded product views.
- Buyer enquiries.
- Category-level activity.
- Average product prices.
- Recent activity comparisons.

Database views summarize marketplace activity and help identify categories receiving buyer interest.

### Machine Learning Features

The Python ML module supports:

- **Demand prediction:** Estimates product demand using available input features.
- **Price estimation:** Provides exploratory price estimates using production costs and model predictions.
- **Customer segmentation:** Groups customers based on purchasing behavior.
- **Trend analysis:** Identifies category-level trends from the available training data.
- **Model evaluation:** Reports model performance metrics.

### Data Transparency

Synthetic training data is used for ML development and evaluation.

Exploratory model predictions and evaluation results are not verified live market insights.

Live demand forecasts use recorded marketplace data and should clearly indicate when insufficient historical sales data is available.

Replace synthetic training datasets with verified KalaSetu marketplace data before using ML predictions for real business decisions.

---

## Future Enhancements

- More regional language support.
- Improved AI-powered product recommendations.
- Advanced artisan analytics.
- Expanded market linkage opportunities.
- Enhanced marketplace discovery.
- Additional tools for artisan business growth.

---

## Contributors

Developed collaboratively as an AI-driven marketplace project focused on supporting rural and traditional artisans.

Contributions, suggestions, and improvements are welcome.

---

**KalaSetu – Connecting Artisans to Opportunities.**
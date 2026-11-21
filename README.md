# KalaSetu – AI-Driven Market Linkage and Smart Cataloging

**Empowering Rural Artisans Through AI, Digital Market Access and Multilingual Technology**

KalaSetu is an AI-powered marketplace platform designed to connect rural and traditional artisans with potential customers. It simplifies product cataloging, improves product presentation, supports multilingual interactions, and helps artisans showcase their products in a digital marketplace.

The platform combines AI-assisted catalog generation, image enhancement, market insights and enquiry management to help artisans improve their online presence and reach wider markets.

> **Merged project documentation:** Start with [MERGE_NOTES.md](MERGE_NOTES.md) for authentication, database upgrades, artisan approval and additional setup instructions.

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
- [Future Enhancements](#future-enhancements)

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

KalaSetu provides a unified digital platform where artisans can register, showcase their products, generate product catalog content, enhance product images and manage customer enquiries.

AI-assisted tools reduce the effort required to create professional product listings, while multilingual support makes the platform more accessible.

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
- Support for English, Kannada, Hindi, Tamil, Telugu and Malayalam.
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
- AI-assisted pricing support.
- Help artisans make more informed product listing decisions.

### 7. Conversational AI Assistance
- AI-powered conversational assistance.
- Help users with catalog-related queries.
- Support artisan workflows through the AI services.

### 8. Enquiry Management
- Manage customer enquiries.
- Connect enquiries with products and artisans.
- Support enquiry status and response workflows.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Supabase |
| Authentication | Supabase Auth |
| AI Integration | Google Gemini |
| Image Processing | Python, FastAPI, OpenCV |
| API Communication | REST APIs |
| Development Tools | Git, GitHub, Supabase CLI |

## Project Architecture

KalaSetu uses a modular architecture with separate frontend, backend, database and image-processing components.

```text
                 USERS
                   |
                   v
          React + Vite Frontend
                   |
                   v
            Express Backend
             /     |      \
            /      |       \
           v       v        v
       Supabase  Gemini   Market &
       Database   AI      AI Services
           |
           v
      PostgreSQL

       React Frontend
             |
             v
       FastAPI Service
             |
             v
       OpenCV Processing
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

```bash
npx supabase db push
```

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

## API Endpoints

### Express Backend

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| GET, POST, PUT, DELETE | `/api/products` | Product management |
| GET, POST, PUT | `/api/artisans` | Artisan management |
| GET, POST, PATCH | `/api/enquiries` | Enquiry management |
| POST | `/api/ai/catalog` | AI catalog generation |
| POST | `/api/ai/chat` | Conversational assistance |
| POST | `/api/ai/enhance-image` | AI image-related endpoint |
| POST | `/api/ai/pricing` | AI-assisted pricing |
| GET | `/api/market/trends` | Market trends |

### FastAPI Image Service

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Image service health |
| POST | `/api/enhance` | Product image enhancement |

Actual access to endpoints may depend on authentication and artisan authorization.

## Image Enhancement

The image enhancement service uses FastAPI and OpenCV.

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
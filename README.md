# AR lead intake visualizer

*Automatically synced with deployments*

[![Deployed on Leon’s](https://www.leonshardwood.com)]
(https://quote.leonshardwood.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/tequilapapas-projects/v0-ar-lead-intake-visualizer)

## Overview

This repository will stay in sync
changes made to deployed app will be automatically be pushed to this repository from (https://v0.app).

## Deployment

project is live at:

**[https://vercel.com/tequilapapas-projects/v0-ar-lead-intake-visualizer](https://vercel.com/tequilapapas-projects/v0-ar-lead-intake-visualizer)**

## Build app
# Leon's Hardwood Floors - AR Lead Intake Visualizer

A Next.js application combining a pricing calculator with an AR camera visualizer for hardwood flooring projects. Customers can estimate costs and visualize wood profiles in real-time using their device camera.

## Features

### 1. **Project Calculator** (`/`)
- Multi-step form for project estimation
- Project types: Refinishing, New Hardwood, LVP, Kitchen Remodel
- Square footage calculator with price ranges
- Timeline selection
- Lead capture with contact details
- Integration with GoHighLevel CRM

### 2. **AR Camera Visualizer** (`/camera`)
- Real-time camera preview
- Browse wood profiles from database
- Texture overlay (beta)
- Live profile switching
- Lead capture with selected profile tracking

### 3. **Admin Panel** (`/admin/wood-profiles`)
- Upload and manage wood profiles
- Image and texture uploads via Vercel Blob
- Database integration with Supabase
- Profile editing and deletion

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Vercel Blob
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Database Schema

### `wood_profiles` table
- `id` (uuid, primary key)
- `name` (text) - Display name (e.g., "Versailles • Walnut")
- `description` (text) - Detailed description
- `wood_type` (text) - Wood species
- `finish` (text) - Finish type (Matte, Satin, Gloss)
- `color` (text) - Color description
- `price_per_sqft` (numeric) - Price per square foot
- `image_url` (text) - Profile display image (Vercel Blob)
- `texture_url` (text) - AR texture image (Vercel Blob)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `leads` table
- `id` (uuid, primary key)
- `name`, `email`, `phone`, `address` (text)
- `project_type` (text)
- `estimated_sqft` (numeric)
- `estimated_price` (numeric)
- `selected_wood_id` (uuid) - References wood_profiles
- `timeline` (varchar)
- `status` (text)
- Additional project details and metadata

### `ar_sessions` table
- `id` (uuid, primary key)
- `lead_id` (uuid) - References leads
- `session_duration` (integer)
- `screenshots` (jsonb)
- `measurements` (jsonb)
- `room_dimensions` (jsonb)

## Getting Started

### Prerequisites
- Node.js 18+
- Vercel account (for Blob storage)
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd leonscalculatormain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Vercel Blob
   BLOB_READ_WRITE_TOKEN=your_blob_token
   
   # Database (auto-populated by Supabase)
   POSTGRES_URL=your_postgres_url
   POSTGRES_PRISMA_URL=your_postgres_prisma_url
   ```

4. **Run database migrations**
   
   Execute the SQL scripts in the `scripts/` folder in your Supabase SQL editor or use the v0 script runner.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## How to Upload Wood Profiles

### Method 1: Admin Panel (Recommended)

1. **Navigate to the admin panel**
   - Go to `/admin/wood-profiles`
   
2. **Click "+ Add New Profile"**

3. **Fill in the form**
   - **Profile Name**: Display name (e.g., "Versailles • Walnut")
   - **Wood Type**: Species (e.g., "American Walnut")
   - **Finish**: Type of finish (Matte, Satin, Gloss)
   - **Color**: Color description
   - **Price per sq ft**: Cost per square foot
   - **Description**: Detailed description for customers
   
4. **Upload images**
   - **Profile Image**: Display image for profile selection (JPG/PNG)
   - **Texture Image**: High-resolution texture for AR overlay (JPG/PNG)
     - Recommended: Seamless tileable texture
     - Resolution: 1024x1024 or higher
     - Format: JPG or PNG

5. **Click "Add Wood Profile"**
   
   Images are automatically uploaded to Vercel Blob and URLs are stored in Supabase.

### Method 2: Direct Database Insert

```sql
INSERT INTO wood_profiles (
  name, 
  description, 
  wood_type, 
  finish, 
  color, 
  price_per_sqft,
  image_url,
  texture_url
) VALUES (
  'Versailles • Walnut',
  'Elegant parquet pattern...',
  'American Walnut',
  'Matte',
  'Rich warm brown',
  45.00,
  'https://your-blob-url/image.jpg',
  'https://your-blob-url/texture.jpg'
);
```

### Image Guidelines

**Profile Images:**
- Purpose: Thumbnail for profile selection
- Size: 400x400px minimum
- Format: JPG or PNG
- Content: Clear photo of the flooring

**Texture Images:**
- Purpose: AR overlay on camera feed
- Size: 1024x1024px or higher
- Format: JPG or PNG (seamless)
- Content: Tileable texture with minimal distortion
- Best practice: Use a flat, evenly-lit photo of the wood grain

## API Routes

### `POST /api/leads`
Submit a lead from calculator or camera visualizer
- Accepts JSON payload with contact and project details
- Forwards to GoHighLevel webhook
- Returns `{ ok: true }` on success

### `GET /api/wood-profiles`
Fetch all wood profiles
- Returns `{ ok: true, profiles: [...] }`

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure environment variables**
   - Add all variables from `.env.local` in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy**
   - Vercel will automatically build and deploy

### Post-Deployment

1. **Seed wood profiles**
   - Visit `/admin/wood-profiles`
   - Upload your initial wood profiles

2. **Test the AR camera**
   - Visit `/camera` on a mobile device
   - Grant camera permissions
   - Switch between wood profiles

## Project Structure

```
.
├── app/
│   ├── page.tsx                    # Main calculator
│   ├── camera/page.tsx             # AR camera visualizer
│   ├── admin/wood-profiles/page.tsx # Admin panel
│   ├── api/
│   │   ├── leads/route.ts          # Lead submission
│   │   └── wood-profiles/route.ts  # Profile fetching
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── ui/                         # shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client
│   └── utils.ts
├── scripts/
│   └── 001_create_wood_profiles_sample_data.sql
└── public/
    └── placeholder.svg
```

## Troubleshooting

### Camera not working
- Check browser permissions (Settings → Privacy → Camera)
- Use HTTPS (required for camera access)
- Try a different browser (Chrome/Safari recommended)

### Wood profiles not loading
- Check Supabase connection in environment variables
- Verify RLS policies allow public SELECT on `wood_profiles`
- Check browser console for errors

### Images not uploading
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check file size (max 4.5MB for free tier)
- Ensure Vercel Blob integration is connected

## Support

For questions or issues, contact the development team or open an issue in the repository.

## License

Proprietary - Leon's Hardwood Floors

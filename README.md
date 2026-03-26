# SIQ Offline — Revenue Dashboard

Live dashboard connected to your Excel file. Deploys to Vercel.

## Quick Deploy to Vercel

### 1. Install & Test Locally
```bash
cd siq-dashboard
npm install
npm run dev
```
Open http://localhost:3000

### 2. Deploy to Vercel

**Option A — Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Option B — GitHub:**
1. Push to GitHub:
```bash
git init && git add . && git commit -m "dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USER/siq-dashboard.git
git push -u origin main
```
2. Go to vercel.com/new → Import repo → Deploy

### 3. Update Data
Replace `data/dashboard.xlsx` with your new Excel file, then:
```bash
git add . && git commit -m "update data" && git push
```
Vercel auto-redeploys on push.

## How It Works
- Excel is parsed at **build time** (not runtime)
- Data is baked into the page HTML — no API calls needed
- Fast, static, works perfectly on Vercel's free tier

## Required Sheet Names
- `Business - AdmissionRevenue`
- `Business - Lead Funnel 1`

## Project Structure
```
siq-dashboard/
├── app/
│   ├── page.jsx                ← Server component (reads Excel at build)
│   ├── layout.jsx
│   └── components/
│       └── Dashboard.jsx       ← Client component (all charts)
├── data/
│   └── dashboard.xlsx          ← YOUR EXCEL FILE
├── lib/
│   └── parseExcel.js           ← Excel parser
├── package.json
├── next.config.js
└── jsconfig.json
```

# Suvidha Setu Deployment Guide

This document outlines the steps required to deploy the Suvidha Setu platform to Vercel.

## Architecture

- **Frontend:** Next.js 15 (React 19, Tailwind CSS v4)
- **Backend:** FastAPI (Python)
- **Database:** SQLite (Read-only on Vercel)

Both frontend and backend are deployed together in a monorepo setup on Vercel. The frontend handles API rewrites pointing to the backend.

## Environment Variables

### Frontend (`web/.env.example`)
```env
NEXT_PUBLIC_API_URL=https://suvidhasetu-backend.vercel.app
```
*Note: In the current setup, we use `next.config.ts` rewrites to proxy `/api/backend/*` to the deployed backend URL, mitigating CORS issues entirely.*

### Backend (`.env.example`)
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: Gemini is ONLY used for language translation and summarization, not for deterministic eligibility ranking.*

## Deployment Steps

1. **Deploy the Backend first:**
   - Link the root directory or `api` to a Vercel project (e.g., `suvidhasetu-backend`).
   - Framework preset: `FastAPI` or `Other`.
   - Build Command: `pip install -r requirements.txt` (or handled automatically if `vercel.json` is configured).
   - Add the `GEMINI_API_KEY` to Vercel Environment Variables.
   - Note the deployed URL (e.g., `https://suvidhasetu-backend.vercel.app`).

2. **Deploy the Frontend:**
   - Link the `web` directory to a Vercel project (e.g., `suvidhasetu-frontend`).
   - Framework preset: `Next.js`.
   - Ensure `next.config.ts` rewrite destination matches the deployed backend URL.
   - Deploy.

## Verification Checklist
- [x] Run `npm run build` locally in `web` to catch TS errors.
- [x] Run backend locally and verify API endpoints.
- [x] Ensure `cache/schemes.db` is tracked in git and pushed, as Vercel will mount it read-only.
- [x] Test Vercel build locally: `vercel build`.

# Suvidha Setu Web

Next.js frontend for Suvidha Setu, the public scheme recommender and browse experience.

## Local Development

Run from `web/`:

```bash
npm run dev
```

Open `http://localhost:3000`.

For local backend testing, run the FastAPI app from the repository root:

```bash
.venv/bin/uvicorn api.main:app --reload --port 8000
```

## Production Setup

The frontend is deployed on Vercel as the `suvidha-setu` project.

Use these Vercel project settings for GitHub deployments:

```text
Root Directory: web
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

If Vercel is trying to build from the repository root, it will fail with
`Couldn't find any pages or app directory` because the Next.js `app/` directory
lives inside `web/`, not at the repo root.

Required environment variables:

```text
BACKEND_API_URL=https://scheme-finder-api.vercel.app
UPSTASH_REDIS_REST_URL=[FILL: Upstash REST URL]
UPSTASH_REDIS_REST_TOKEN=[FILL: Upstash REST token]
```

Optional:

```text
NEXT_PUBLIC_SITE_URL=https://suvidha-setu.vercel.app
```

## Public Documentation Pages

- `/contribute` - contribution guidance and safety rules.
- `/insights/launch-notes` - recent production-readiness changes.
- `/insights/how-it-works` - recommender engine and scoring explanation.
- `/insights/demographics` - demographic data report.
- `/insights/hidden-schemes` - hyper-specific schemes overview.

## Recent Frontend Changes

- Browse search for known scheme names, ministries, states, categories, descriptions, tags, and slugs.
- Search within matched results after questionnaire completion.
- Question transitions, result-card reveals, and smoother scheme-card hover states.
- English plus 12 Indian language options through Google Translate.
- Privacy-first questionnaire notice and no client-side persistence of sensitive answers.
- Global public visit counter backed by Upstash Redis.
- Footer credit: Built with love and safety by Ayushideep.
- Basic frontend API rate limits and request-size checks.

## Contribution and Security Notes

- Contributions are welcome. See `../CONTRIBUTING.md`.
- Security reports should follow `../SECURITY.md`.
- Do not commit real Vercel, Upstash, or backend credentials.
- Do not add logging or analytics that capture sensitive questionnaire answers.

## Build

```bash
npm run build
```

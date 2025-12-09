# Chomper Deployment Guide

This guide explains how to deploy Chomper with a split architecture:
- **Frontend** → Vercel (free tier, global CDN)
- **Backend** → Railway or Render (always-on server)
- **Database** → Neon PostgreSQL (keep using current)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         FRONTEND (Vercel)               │
│    - React app with Vite                │
│    - Global CDN, fast loading           │
│    - Custom domain support              │
└─────────────────┬───────────────────────┘
                  │ HTTPS API calls
┌─────────────────▼───────────────────────┐
│         BACKEND (Railway/Render)        │
│    - Express.js API                     │
│    - Authentication & sessions          │
│    - Push notification cron jobs        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         DATABASE (Neon)                 │
│    - PostgreSQL                         │
│    - Free tier up to 3GB                │
└─────────────────────────────────────────┘
```

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project

### 1.2 Connect GitHub Repository
1. In Railway, click "New Service" → "GitHub Repo"
2. Connect your Chomper repository
3. Railway will auto-detect it's a Node.js app

### 1.3 Configure Build Settings
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Root Directory**: `/` (leave as default)

### 1.4 Set Environment Variables
Add these in Railway's "Variables" tab:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Random string for session encryption | `your-secret-key-here` |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://chomper.vercel.app` |
| `RESEND_API_KEY` | For sending emails | `re_xxxxxx` |
| `VAPID_PUBLIC_KEY` | For web push notifications | (generate with web-push) |
| `VAPID_PRIVATE_KEY` | For web push notifications | (generate with web-push) |
| `VAPID_EMAIL` | Email for VAPID | `mailto:your@email.com` |

### 1.5 Deploy
Railway will automatically deploy when you push to your main branch.

**Note your Railway URL** (e.g., `https://chomper-api.up.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub account

### 2.2 Import Repository
1. Click "Add New" → "Project"
2. Select your Chomper repository

### 2.3 Configure Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npx tsx script/build-frontend.ts`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 2.4 Set Environment Variables
Add these in Vercel's "Environment Variables" section:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Your Railway backend URL | `https://chomper-api.up.railway.app` |

**Important Notes**:
- Variables prefixed with `VITE_` are exposed to the browser
- `VITE_API_URL` must NOT have a trailing slash (use `https://api.example.com` not `https://api.example.com/`)

### 2.5 Deploy
Click "Deploy" and Vercel will build and deploy your frontend.

---

## Step 3: Update Backend FRONTEND_URL

After Vercel deploys, go back to Railway and update:
- `FRONTEND_URL` = Your new Vercel URL (e.g., `https://chomper.vercel.app`)

This enables CORS and proper cookie settings for cross-domain authentication.

---

## Alternative: Deploy Backend to Render

### Render Configuration
1. Create account at [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository

**Build Settings**:
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

**Environment Variables**: Same as Railway (see Step 1.4)

---

## Local Development

For local development with the split architecture:

1. Create `.env` file in project root:
```env
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=local-dev-secret
RESEND_API_KEY=your_resend_key
```

2. Run backend:
```bash
npm run dev
```

3. For frontend development with a separate backend, create `.env.local` in project root:
```env
VITE_API_URL=http://localhost:5000
```

---

## Generating VAPID Keys

For push notifications, generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This outputs:
```
Public Key: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxM
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add these as environment variables on your backend.

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly on backend
- The URL should NOT have a trailing slash
- Example: `https://chomper.vercel.app` (not `https://chomper.vercel.app/`)

### Session/Cookie Issues
- Cross-domain cookies require `sameSite: 'none'` and `secure: true`
- Both frontend and backend must be on HTTPS
- Check browser DevTools → Application → Cookies

### Push Notifications Not Working
- Verify VAPID keys are set on backend
- Service worker must be served from frontend domain
- Check browser console for registration errors

---

## Custom Domains

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Railway (Backend)
1. Go to Service Settings → Networking
2. Add custom domain
3. Update DNS records

**Remember**: After changing domains, update `FRONTEND_URL` on backend and `VITE_API_URL` on frontend.

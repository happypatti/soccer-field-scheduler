# Soccer Field Scheduler - Setup Guide

This guide will help you deploy the Soccer Field Scheduler to a new Vercel account with a new Neon database.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Neon account (free tier works)
- Node.js 18+ installed locally

---

## Step 1: Fork or Clone the Repository

### Option A: Fork (Recommended)
1. Go to `https://github.com/happypatti/soccer-field-scheduler`
2. Click "Fork" button
3. This creates a copy in your GitHub account

### Option B: Clone and Push to New Repo
```bash
git clone https://github.com/happypatti/soccer-field-scheduler.git my-field-scheduler
cd my-field-scheduler
# Remove old origin
git remote remove origin
# Add your new repo
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign in
2. Click "New Project"
3. Name it (e.g., "soccer-scheduler")
4. Select region closest to you
5. Click "Create Project"
6. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)

**Keep this connection string safe - you'll need it!**

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Add these Environment Variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (update after first deploy) |
| `RESEND_API_KEY` | Your Resend API key (for emails, optional) |

5. Click "Deploy"

---

## Step 4: Set Up Database Schema

After deployment, you need to push the database schema:

### Option A: From your local machine
```bash
# Install dependencies
npm install

# Push schema to Neon
DATABASE_URL="your-neon-connection-string" npx drizzle-kit push
```

### Option B: Using Vercel CLI
```bash
npm i -g vercel
vercel env pull .env.local
npx drizzle-kit push
```

---

## Step 5: Create Admin User

Run the seed script to create your first admin user:

```bash
DATABASE_URL="your-neon-connection-string" npx tsx scripts/seed-admin.ts
```

This creates:
- **Email:** admin@lasc.org
- **Password:** admin123
- **Role:** admin (full access)

⚠️ **Change this password immediately after first login!**

---

## Step 6: Update NEXTAUTH_URL

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to your actual Vercel URL (e.g., `https://your-app.vercel.app`)
3. Redeploy

---

## Optional: Set Up Email (Resend)

For password reset emails and notifications:

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your domain (or use their test domain for development)
3. Create an API key
4. Add `RESEND_API_KEY` to Vercel environment variables

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ Yes | Random string for session encryption |
| `NEXTAUTH_URL` | ✅ Yes | Your app's URL |
| `RESEND_API_KEY` | ❌ Optional | For sending emails |

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Push database schema
DATABASE_URL="..." npx drizzle-kit push

# Create admin user
DATABASE_URL="..." npx tsx scripts/seed-admin.ts

# Seed sample data (cities, fields, zones)
DATABASE_URL="..." npx tsx scripts/seed-zones.ts

# View database in browser
DATABASE_URL="..." npx drizzle-kit studio
```

---

## Troubleshooting

### "DATABASE_URL is not set"
- Make sure you've added the environment variable in Vercel
- For local dev, create `.env.local` file with the variable

### "relation does not exist"
- Run `npx drizzle-kit push` to create database tables

### Login not working
- Make sure `NEXTAUTH_URL` matches your actual URL
- Regenerate `NEXTAUTH_SECRET` and redeploy

### Emails not sending
- Check `RESEND_API_KEY` is correct
- Verify your sending domain in Resend dashboard

---

## Support

For issues, check the GitHub repository or create an issue.
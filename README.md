# ContractGuard — Single-Vercel-Project Deployment (Client + Server)

This version runs **both** the React frontend and the Express backend on Vercel,
using Vercel Serverless Functions for the API. MongoDB stays external (Atlas),
since Vercel cannot host a database.

## Project Structure

```
contractguard-vercel/
  api/
    index.js          # Serverless function entrypoint - wraps the Express app
  server/
    models/Analysis.js
    routes/analyze.js  # Same routes as before (the AI call lives here)
  client/
    src/App.js, App.css, index.js
    public/index.html
  vercel.json          # Tells Vercel how to route /api/* vs the React build
  package.json          # Root deps - used by the serverless function
  .gitignore
  .env.example
```

## Before you push to GitHub

1. Make sure `.env` (with your real keys) is **never committed**. Only `.env.example` should be in git.
2. If you previously committed a real `.env` or pasted real keys anywhere public, rotate them first:
   - Anthropic: console.anthropic.com -> Settings -> API Keys -> revoke + create new
   - MongoDB Atlas: Database Access -> edit user -> reset password

## Deploy Steps

### 1. MongoDB Atlas (database)
- Create a free M0 cluster at mongodb.com/atlas if you don't already have one.
- Get the connection string (Database -> Connect -> Drivers), looks like:
  `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/contractguard`
- In Atlas -> Network Access, add `0.0.0.0/0` (allow access from anywhere) so Vercel's
  serverless functions can reach it.

### 2. Push this project to GitHub
```bash
git init
git add .
git commit -m "ContractGuard - single Vercel deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. Import into Vercel
- vercel.com -> Add New -> Project -> import your GitHub repo
- **Root Directory: leave as the repo root** (not `client`) — `vercel.json` handles both pieces
- Framework Preset: **Other** (the `buildCommand`/`outputDirectory` in `vercel.json` override auto-detection)
- If you already created a Vercel project earlier and it's misconfigured, easiest is to delete that project and re-import fresh, so settings don't conflict with old values

### 4. Add Environment Variables
In Vercel -> Project -> Settings -> Environment Variables, add:
- `MONGO_URI` = your Atlas connection string
- `ANTHROPIC_API_KEY` = your Anthropic API key

Apply to Production, Preview, and Development.

### 5. Deploy
Click Deploy (or it auto-deploys on push). Once live:
- Visit `https://your-project.vercel.app/api/health` -> should show `{"status":"ok"}`
- Visit `https://your-project.vercel.app/` -> the app itself, fully working end to end

## If something breaks
- **Blank page / 404 on `/api/...`:** check `vercel.json` is at the repo root, and
  that Root Directory in Vercel project settings is the repo root, not `client`.
- **500 on every API call:** check Environment Variables are set correctly in Vercel
  (typos in `MONGO_URI` or `ANTHROPIC_API_KEY` are the most common cause).
- **"Your credit balance is too low":** add billing credit at console.anthropic.com.

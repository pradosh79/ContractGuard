# ContractGuard — Railway Deployment (Single Service)

Railway runs a normal, persistent Node server — no serverless function quirks like
Vercel. This version has Express serve both the API and the built React frontend
together as one service.

## Project Structure

```
contractguard-railway/
  server.js              # Express entrypoint: API routes + serves client/build
  server/
    models/Analysis.js
    routes/analyze.js     # AI call to Claude lives here
  client/
    src/App.js, App.css, index.js
    public/index.html
  package.json             # root - has "build" and "start" scripts Railway uses
  .gitignore
  .env.example
```

## Before pushing to GitHub

Make sure `.env` is never committed — only `.env.example`. If you previously
committed real keys anywhere, rotate them first:
- Anthropic: console.anthropic.com -> API Keys -> revoke + create new
- MongoDB Atlas: Database Access -> reset password

## Deploy Steps

### 1. MongoDB Atlas
- Free M0 cluster at mongodb.com/atlas if you don't have one
- Get the connection string (Database -> Connect -> Drivers)
- Network Access -> add `0.0.0.0/0` so Railway can reach it

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "ContractGuard - Railway deployment"
git branch -M main
git remote add origin <your-repo-url>
git push -f origin main
```

### 3. Deploy on Railway
- railway.app -> New Project -> Deploy from GitHub repo -> select your repo
- Railway auto-detects Node via the root `package.json`
- It will automatically run `npm install`, then `npm run build` (builds the React
  app into `client/build`), then `npm start` (runs `server.js`)
- No special root directory setting needed — this is a single combined service

### 4. Add Environment Variables
In Railway -> your service -> **Variables** tab, add:
- `MONGO_URI` = your Atlas connection string
- `ANTHROPIC_API_KEY` = your Anthropic API key
- (Railway sets `PORT` automatically — you don't need to set it yourself)

### 5. Generate a public domain
Railway -> your service -> **Settings** -> **Networking** -> **Generate Domain**
This gives you a URL like `https://contractguard.up.railway.app`

### 6. Test
- Visit `https://your-app.up.railway.app/api/health` -> should show `{"status":"ok"}`
- Visit `https://your-app.up.railway.app/` -> the full app, working end to end

## If something breaks
- **Build fails:** check Railway's build logs (Deployments tab -> click the
  deployment -> View Logs). Most common cause: a typo in an environment variable
  name, or the client's `npm install` failing — check for red error lines.
- **App loads but scan fails:** check `MONGO_URI` and `ANTHROPIC_API_KEY` are set
  correctly in the Variables tab — no quotes, no trailing spaces.
- **"Your credit balance is too low":** add billing credit at console.anthropic.com.

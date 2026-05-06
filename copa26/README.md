# ⚽ Copa 26 — World Cup 2026 Prediction Pool

A dead-simple prediction pool app for friends. Pick your winners for each award category, submit, and see who predicted the tournament correctly on the leaderboard.

## Features
- 🏆 8 prediction categories (Golden Boot, Golden Ball, Golden Glove, etc.)
- 📊 Live leaderboard with scoring (3pts/2pts/1pt for 1st/2nd/3rd)
- 🔒 Picks lock once results are set
- 👥 20+ players supported, no accounts needed — just a name
- 📱 Mobile-friendly

## Categories
| Category | Description |
|---|---|
| Golden Boot 👟 | Top goal scorer |
| Golden Ball ⭐ | Best player of the tournament |
| Golden Glove 🧤 | Best goalkeeper |
| Best Young Player 🌟 | Best player under 21 |
| Most Assists 🎯 | Most assists |
| World Cup Champion 🏆 | The winning team |
| Dark Horse Team 🐴 | Surprise team of the tournament |
| Most Goals (Team) 🔥 | Team that scores the most |

## Scoring
- Exact match on 1st place → **3 points**
- Exact match on 2nd place → **2 points**  
- Exact match on 3rd place → **1 point**
- Cross-position partial matches also score (e.g., your 2nd pick is their 1st)

## Deploy to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Copa 26 initial"
git remote add origin https://github.com/YOUR_USERNAME/copa26.git
git push -u origin main
```

### 2. Create Railway Service
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Select `copa26` repo
4. Add environment variable: `SESSION_SECRET=your-random-secret-here`
5. Deploy!

### 3. Add a Volume (for data persistence)
1. In Railway, go to your service → Storage → Add Volume
2. Mount path: `/app/data`
3. This persists the NeDB database files across deploys

### 4. Share the URL
Railway gives you a public URL. Share it with your friends — that's it!

## Local Dev
```bash
npm install
node server.js
# Open http://localhost:3000
```

## Environment Variables
| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes (in prod) | Random string for session signing |
| `PORT` | No | Port to run on (Railway sets this automatically) |

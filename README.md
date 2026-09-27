# 🎂 BirthdayBoard

An anonymous, privacy-first birthday-wishing platform. Users celebrate birthdays with public or shared wish boards while keeping real names and private identities strictly confidential.

---

## ✨ Features

- **Anonymous Birthday Boards**: Send wishes with custom pseudonyms ("Anonymous Bestie", "Secret Admirer", etc.) or personalized handles without revealing real identities.
- **Privacy Controls**: Real names and emails remain private to the account holder; only display names, avatars, and birth dates (month & day) are visible to the community.
- **Visual Wish Themes**: Choose from vibrant themes:
  - 🌟 Golden Sparkle
  - 🎈 Birthday Party
  - 🌅 Warmth & Sunset
  - 🎊 Confetti Celebration
  - 🌙 Minimalist Slate
- **AI-Powered Wish Crafting**: Integrated Gemini AI assistant to draft witty, heartfelt, poetic, or goofy birthday messages in one click.
- **Birthday Countdown & Status**: Real-time alerts indicating who is celebrating today, upcoming birthdays, and days remaining.
- **Interactive Reactions & Likes**: Heart wishes, celebrate milestones, and receive instant in-app notifications.
- **Date Simulation Mode**: Built-in developer/demo tool to simulate any calendar date and test birthday transitions seamlessly.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend**: [Express.js](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx), [Vite](https://vitejs.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) managed via [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: [Firebase Authentication](https://firebase.google.com/)
- **AI**: [@google/genai](https://github.com/google/generative-ai-js) (Gemini 2.5 Flash)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL Database** (Local Postgres, or free hosted instances from [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com))

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```env
# Optional: Gemini API Key for AI wish suggestions
GEMINI_API_KEY="your-gemini-api-key"

# Database Connection (Neon, Supabase, Render, Railway, or local)
DATABASE_URL="postgresql://user:password@localhost:5432/birthday_board?sslmode=require"

# Alternatively, set individual SQL variables:
# SQL_HOST="localhost"
# SQL_USER="postgres"
# SQL_PASSWORD="your-password"
# SQL_DB_NAME="birthday_board"
```

### 4. Push Database Schema
Ensure your database exists, then run:
```bash
npm run db:push
```
This automatically syncs tables (`users`, `wishes`, `wish_likes`, `notifications`) using Drizzle ORM.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Pushing to GitHub

1. **Initialize Git** in the project directory:
   ```bash
   git init
   git branch -M main
   ```

2. **Stage and commit your files**:
   ```bash
   git add .
   git commit -m "Initial commit of BirthdayBoard"
   ```

3. **Link to your GitHub repository**:
   Create a new empty repository on [GitHub](https://github.com/new), then copy its URL and run:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   ```

4. **Push your code**:
   ```bash
   git push -u origin main
   ```

---

## 🌐 Hosting Guide

BirthdayBoard is a full-stack Node.js + Express application that bundles and serves the Vite React frontend.

### Option A: Render.com (Recommended & Easiest)
1. Sign in to [Render](https://render.com).
2. Create a free **PostgreSQL Database** under **New +** -> **PostgreSQL**. Copy the `Internal Database URL` or `External Database URL`.
3. Create a **New +** -> **Web Service** connected to your GitHub repo.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npm run db:push`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Postgres connection string from Step 2)*
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**!

---

### Option B: Railway.app
1. Go to [Railway.app](https://railway.app) and create a new project.
2. Add a **PostgreSQL** database service.
3. Add a service from your GitHub repo.
4. Set build & start settings:
   - **Build Command**: `npm run build && npm run db:push`
   - **Start Command**: `npm start`
5. In your project variables, attach `DATABASE_URL` (Railway links this automatically) and add `GEMINI_API_KEY`.
6. Deploy!

---

### Option C: Fly.io
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` in the repository root.
3. Attach a Postgres cluster: `fly postgres create` and `fly postgres attach`.
4. Set secrets: `fly secrets set GEMINI_API_KEY=your_key`.
5. Run `fly deploy`.

---

## 📜 Available Scripts

- `npm run dev`: Runs the full-stack dev server on port 3000 with hot-reload.
- `npm run build`: Compiles production frontend assets to `dist/`.
- `npm start`: Runs the Node.js production server serving API + static assets.
- `npm run db:push`: Applies database schema migrations using Drizzle Kit.
- `npm run lint`: Verifies TypeScript types without emitting code.

---

## 🔒 Security & Privacy Notice

- All messages sent anonymously never expose the sender's account UID or email to clients.
- Passwords and auth tokens are handled securely via Firebase Auth and server-side token validation.
- Input strings are sanitized to protect against cross-site scripting (XSS).

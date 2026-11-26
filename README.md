# Chatkaro Food Hub

Live pure-veg restaurant hub for **Chatkaro Food Hub (Talala, Gujarat)** — Menu, Cart & WhatsApp Ordering, Live Tables, Lounge Chat, Tawa Rush Game, Google Maps Photos & Reviews, AI Menu Assistant, and Owner Admin Dashboard.

## Option 1: Deploy Full Live App (Recommended — Render.com Free)

`server.js` runs a zero-dependency Node.js server with real-time SSE sync, Admin dashboard, AI assistant, and multiplayer game rooms.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/akgffbnk223-source/chatkara)

Or manually on **Render.com**:
1. Sign in at [render.com](https://render.com) with GitHub.
2. Click **New + → Web Service** (or **Blueprint** using `render.yaml`).
3. Select the **`akgffbnk223-source/chatkara`** repository.
4. Keep **Start Command** as `node server.js` and **Plan** as `Free`, then click **Deploy**.

## Option 2: Deploy Static Version on GitHub Pages

GitHub Pages hosts static files only (no Node.js backend). In static mode, the menu, cart, WhatsApp ordering, photos, reviews, tables, and solo Tawa Rush game work locally in the browser:

1. Open your GitHub repo → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select **Branch: `main`** and **`/ (root)`**, then click **Save**.
4. Your site will go live at `https://akgffbnk223-source.github.io/chatkara/`.

## Run Locally

```bash
node server.js
```

Then open `http://localhost:8765`.

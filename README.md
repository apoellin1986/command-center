# Command Center — Personal Transformation Tracker

A private, offline-first PWA to track weight loss, fitness discipline, supplements,
futsal, push-ups and daily consistency. No login, no cloud, no accounts. All data
lives **only on your device** in `localStorage`.

Built for one purpose: tell you honestly whether you're progressing — or lying to
yourself — before you turn 40.

---

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS** (dark by default)
- **Recharts** for trend charts
- **vite-plugin-pwa** for installable, offline support
- **localStorage** for storage (simple, synchronous, reliable for this data size)

---

## Run it locally

```bash
npm install
npm run dev
```

Open the printed URL (default <http://localhost:5173>). On first launch you choose
**Start fresh** or **Load 30-day demo data**.

Other scripts:

```bash
npm run build      # type-check + production build into /dist
npm run preview    # serve the production build locally
npm run typecheck  # types only
```

---

## Open it on your phone (same Wi-Fi)

1. Make sure your phone and PC are on the **same Wi-Fi network**.
2. Run `npm run dev` — the dev server already binds to your network (`--host`).
3. In the terminal output, find the **Network** URL, e.g. `http://192.168.1.23:5173`.
   - If it isn't shown, find your PC's IP: run `ipconfig` (Windows) and use the
     IPv4 address, with port `5173`.
4. Type that URL into your phone's browser.

> For the most reliable phone experience (and a permanent install), run
> `npm run build` then `npm run preview` — it serves the optimized build, also on
> the Network URL it prints. The service worker (offline mode) only activates in a
> production build, not in `npm run dev`.

---

## Install as a PWA (Add to Home Screen)

**iPhone (Safari):** open the Network URL → Share → **Add to Home Screen**.

**Android (Chrome):** open the Network URL → menu (⋮) → **Install app** /
**Add to Home Screen**.

**Desktop (Chrome/Edge):** open the URL → install icon in the address bar.

Once installed it runs full-screen and works **offline** after the first load.

---

## Back up your data

Because everything is stored locally, **clearing your browser data wipes it.**
Go to **Settings → Data**:

- **Export all data (JSON)** — full backup. Do this regularly.
- **Import data (JSON)** — restore a backup or move to another device/browser.
- **Weight CSV** / **Check-ins CSV** — for spreadsheets.
- **Reset all data** — wipes everything (with confirmation).

To move between phone and PC: export JSON on one, import on the other.

---

## What's in it

| Section | Where |
|---|---|
| Daily check-in + discipline score + deadline countdown | **Today** |
| Weight goal, 7-day trend, projection, on-track status | **Weight** |
| Supplements, push-ups (+ monthly challenge), discipline | **Habits** |
| Futsal sessions & home workouts | **Futsal** |
| Weekly / monthly reports + local insights | **Reports** |
| Goals, custom supplements, required fields, data tools | **Settings** |
| Monthly calendar with per-day indicators (edit any day) | **Today → Calendar** |

### Discipline score (0–100)

Weight logged 15 · Creatine 15 · Vitamins 5 · Push-ups 15 (scaled to your daily
target) · Water 15 · Workout/Futsal 15 · Notes 10 — normalised to 100.
Bands: 0–39 Poor · 40–59 Weak · 60–79 Decent · 80–100 Strong.

### Weight trend

Uses the **7-day moving average** as the primary signal, so one bad day doesn't
panic the dashboard. Status is green / amber / red vs. the weekly loss you'd need
to hit your target date.

---

## Honest limitations

- **Storage is per-browser, per-device.** No automatic sync. Use JSON export/import
  to move data. Clearing site data / "private browsing" loses it — keep backups.
- **localStorage cap (~5 MB).** Irrelevant for years of daily entries here, but
  worth knowing.
- **No reminders/notifications.** This is a tracker you open, not a nagging app.
- **Insights are heuristic**, generated locally from your numbers — useful signals,
  not medical advice.
- **`npm run dev` has no offline/service-worker.** Offline + install behaviour
  requires a production build (`build` + `preview`, or deploy `/dist`).
- Demo data is clearly flagged; regenerate or reset it from Settings anytime.

---

## Project structure

```
src/
  components/   reusable UI (StatCard, ProgressBar, ToggleButton, charts, nav, ...)
  pages/        Today, Weight, Habits, Futsal, Reports, Settings, Calendar
  hooks/        useRanges (shared week/month/all date windows)
  utils/        date, calculations, reports, insights, exportImport
  storage/      localStorage repo + StoreContext (single source of truth)
  data/         demo data generator
  types/        all TypeScript interfaces
```

# Socratica AI

> **A formative-feedback online judge using differential execution tracing and a Socratic AI layer.**
> Built as a college major project by **Krishnapriya Koppolu**.

---

## What Is This?

When a student's code fails, instead of saying "Wrong Answer," Socratica runs their code and a correct reference solution **side by side**, finds the exact moment their execution diverges from the correct one, and uses an AI layer to ask a **guiding Socratic question** — not give the answer.

The novel idea: **differential execution tracing**. Not output comparison. Actual step-by-step trace comparison.

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **React 18** + **Vite** |
| Styling | **Tailwind CSS v3** (custom design system) |
| Routing | **React Router v6** |
| Fonts | **Inter** (UI) + **JetBrains Mono** (code/labels) |
| Icons | **Material Symbols Outlined** |

### Backend
| Layer | Technology |
|-------|-----------|
| Server | **Express.js** (Node ≥ 20) |
| Auth | **JWT** + **bcryptjs** |
| Database | **MongoDB** via **Mongoose** |
| Cache | **Redis** via **ioredis** |
| Sandbox | **Docker** via **dockerode** |
| AI Layer | **Google Gemini** + **Anthropic Claude** |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Containerisation | **Docker Compose** |
| Reverse Proxy | **nginx** |
| Execution Sandbox | Isolated Docker containers (network-off, 256MB RAM, 2s CPU cap) |

---

## Project Structure

```
socratica/
├── client/                   # Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Atomic: Button, Badge, Icon
│   │   │   ├── TopNavBar.jsx
│   │   │   ├── MobileNav.jsx
│   │   │   ├── TopNavLayout.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   └── SettingsLayout.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ModulesPage.jsx
│   │   │   ├── Workspace.jsx
│   │   │   ├── TrajectoryViewPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── ArchivePage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── api/              # Axios client + route helpers
│   │   ├── App.jsx           # Router config
│   │   └── index.css         # Design system (Tailwind @layer)
│   ├── tailwind.config.js    # Token definitions
│   └── vite.config.js
│
├── server/                   # Express backend
│   ├── models/               # Mongoose schemas
│   ├── routes/               # auth, submissions, problems
│   ├── middleware/           # requireAuth JWT guard
│   ├── tracer/               # pythonTracer.py differential engine
│   ├── sandbox/              # Docker sandbox runner
│   └── server.js
│
├── scripts/                  # DB seed, oracle verification
├── docker/                   # nginx.conf
├── docker-compose.yml
└── refactored/               # Original static HTML prototypes (13 pages)
```

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Curriculum Dashboard** | Mastery progress bars, hero banner with execution trace tagline, module grid, activity timeline |
| `/modules` | **Modules** | Module explorer with search, filter pills, glass hero with circular progress ring |
| `/workspace` | **Workspace** | Three-pane IDE: problem description · code editor · console output + Submit |
| `/trajectory` | **Trajectory View** | Convergence timeline, step-by-step code playback, Tier 1/2 divergence analysis panel, mentor hint |
| `/analytics` | **Analytics** | KPI cards, Skill Mastery radar chart, milestone timeline, complexity heatmap |
| `/archive` | **Archive** | Mastered module stats, legacy codebase list, archive card grid |
| `/settings` | **Settings** | User identity, IDE preferences, API keys, plan & billing |
| *(unauthenticated)* | **Auth** | Sign In / Register with JWT auth, accessible tab switcher, loading state |

---

## Design System

A unified dark design system built in `client/src/index.css` + `tailwind.config.js`.

**Color Palette** — Material 3-inspired, dark surface hierarchy:
- `--background / --surface`: `#0b1326`
- `--primary`: `#c3c0ff` (lavender)
- `--primary-container`: `#4f46e5` (indigo CTA)
- `--secondary`: `#bace99` (sage green — success)
- `--tertiary`: `#ffb95f` (amber — warnings/divergence)
- `--error`: `#ffb4ab` (coral)
- Surface elevation: `lowest → low → base → high → highest`

**Typography:**
- Headings: `Inter` (`font-sans`) — 40px / 32px / 24px
- Labels / buttons / mono: `JetBrains Mono` (`font-mono`) — 12px / 10px
- Body: `Inter` — 16px

**Atomic Components:**
- `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg|icon">`
- `<Badge variant="primary|secondary|tertiary|error">`
- `<Icon name="..." size={24} filled />`

---

## Auth Page

The entry point to the application — users must sign in or register before accessing any route.

- Email + Password auth via JWT
- Tab switcher with `role="tablist"` / `aria-selected`
- Error banner with `role="alert"` / `aria-live="assertive"`
- Loading spinner on submit
- Background depth with fixed glow orbs
- `autoComplete` attributes for browser autofill

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker + Docker Compose
- MongoDB (local or Atlas)
- Redis

### 1. Clone & Install

```bash
git clone https://github.com/your-username/socratica.git
cd socratica

# Install backend
cd server && npm install

# Install frontend
cd ../client && npm install
```

### 2. Environment Variables

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/socratica
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
PORT=5000
```

### 3. Run in Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend → http://localhost:5173  
Backend API → http://localhost:5000

### 4. Run with Docker

```bash
docker compose up --build
```

App → http://localhost (nginx on port 80)

### 5. Seed the Database

```bash
node scripts/seedProblems.js
```

---

## Differential Execution — How It Works

```
Student Code                 Reference Solution
     │                              │
     ▼                              ▼
Python Tracer (sys.settrace)  Python Tracer
     │                              │
     ▼                              ▼
Trace Events: [{line, vars}]  Trace Events: [{line, vars}]
     │                              │
     └──────────── diff ────────────┘
                    │
                    ▼
         Divergence Point Found
                    │
                    ▼
        Gemini / Claude AI Layer
                    │
                    ▼
        Socratic Question (not the answer)
```

**Tier 1** — Step-level differential: compares variable states at each executed line.  
**Tier 2** — Outcome-level differential: compares final output / return value only.

---

## Accessibility

- WCAG 2.1 AA compliant
- All icon-only buttons have `aria-label`
- Skip-to-main-content link for keyboard users
- Console output uses `role="log"` + `aria-live="polite"`
- Form fields have explicit `htmlFor` / `id` pairs
- Mobile nav: `aria-expanded`, `aria-controls`, `aria-hidden`
- Focus rings on all interactive elements via `focus-visible:ring-2`

---

## Author

**Krishnapriya Koppolu** — College Major Project, 2026

---

*"Learn code the way AI traces it."*

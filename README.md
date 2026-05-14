# S.A. — Super Assistant Executive AI Chief of Staff

Part of the **MurphBoard Ecosystem**. S.A. is a real-time command platform that aggregates every operational agent, deployment, revenue lane, and project under a single executive dashboard.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11+), modular routers |
| Database | Supabase (PostgreSQL + Realtime) |
| Deploy | Render (two services: frontend + backend) |
| AI | OpenAI GPT-4o (reports + task routing) |
| Integrations | GitHub API, Render API |

---

## Agents Monitored

| Agent | Domain |
|-------|--------|
| **Hunter** | Automated trading — stock, crypto, congressional signals |
| **Leon** | E-commerce — Etsy, Gumroad, Printful shirt pipeline |
| **SAPP** | Creative — music album (June 19), Gabe's Return movie |
| **AO** | Career — job application pipeline |
| **Optix** | Research — dissertation progress, Murphy Optics R&D |
| **Ninja Squad** | Investigations — active cases & case log |

---

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GITHUB_TOKEN` | GitHub personal access token |
| `RENDER_API_KEY` | Render API key |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

---

## Deployment

Push to `main` — `render.yaml` drives auto-deploy for both services. Set env vars in Render dashboard.

---

## Database

Run `backend/supabase_schema.sql` against your Supabase project via the SQL editor.

---

## Phase Roadmap

- **Phase 1 (current):** Scaffold — all agents visible, deployment audit, daily briefing, alert feed
- **Phase 2:** Real-time WebSocket push, Supabase Realtime subscriptions, agent task queue
- **Phase 3:** Agent autonomy hooks, revenue analytics charts, S.A. mobile view

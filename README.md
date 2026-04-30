# Finance Demo (AW Client Report Portal) — Frontend

A small **multi-page** (MPA) frontend used to manage client households and generate/download quarterly reports (PDFs). Built with **vanilla HTML/CSS/JS** and bundled/served with **Vite**.

## What’s in here

- **Clients list**: `clients.html`
- **Client profile**: `client.html?id=<clientId>`
- **Shared JS modules**: `js/` (API wrapper, money parsing/formatting, calculations, DOM helpers)
- **Styles**: `styles/` (tokens + base + per-page CSS)

## Prerequisites

- Node.js 18+ (recommended)
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```bash
VITE_API_BASE=https://your-backend.example.com
```

Notes:
- `VITE_API_BASE` is read at build/dev time via `import.meta.env.VITE_API_BASE` (see `js/api.js`).

## Run locally

Start the dev server:

```bash
npm run dev
```

Then open the URLs Vite prints in the terminal (Vite serves the HTML entrypoints).

## Build & production run

Build:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

Serve the built `dist/` directory (used by some hosts):

```bash
PORT=3000 npm run start
```

## Scripts

- **`npm run dev`**: Vite dev server
- **`npm run build`**: Production build to `dist/`
- **`npm run preview`**: Preview built app with Vite
- **`npm run start`**: Serve `dist/` using `serve` on `0.0.0.0:$PORT`

## Project structure (high level)

```text
.
├── index.html
├── clients.html
├── client.html
├── js/
│   ├── api.js
│   ├── money.js
│   ├── calc.js
│   ├── dom.js
│   ├── clients-page.js
│   └── client-page.js
├── styles/
│   ├── tokens.css
│   ├── base.css
│   └── pages/
├── dist/                  # build output
├── vite.config.js         # multi-page entrypoints
└── package.json
```

## Environment variables

- **`VITE_API_BASE`** (required): Base URL of the backend API (example: `https://…railway.app`).

## Troubleshooting

- **Blank page / API errors**: confirm `.env` has a valid `VITE_API_BASE` and the backend is reachable.
- **CORS/network issues**: this frontend uses `fetch()` directly (see `js/api.js`) and expects the backend to allow browser requests.


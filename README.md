# Market Entry Assistant

AI-powered decision support system for entrepreneurs entering the Syrian market.

## Tech Stack
- React
- Vite
- JavaScript

## Status
MVP Development (Work in Progress)

## Backend / RAG (in progress)

The app is being extended with a RAG (Retrieval-Augmented Generation) backend so
answers are grounded strictly in a private library of reference documents —
never from the model's general knowledge.

- `/server` — Express backend. Holds all API keys (never exposed to the frontend).
  - `config.js` — loads keys from `.env`.
  - `ingest.js` — indexing pipeline (placeholder): PDFs in `/sources` → text → chunks → embeddings → Pinecone. Not implemented yet.
  - `query.js` — retrieval + generation (placeholder): question → embedding → Pinecone search → chat model → answer + sources. Not implemented yet.
  - `index.js` — Express entrypoint, exposes `POST /api/ask`.
- `/sources` — drop reference PDFs here (not committed to git).
- Vector store: **Pinecone** (API-based, no local index — chosen so nothing memory-heavy runs on a 4GB machine).
- Embedding-API and chat-model providers are **not yet chosen** — see the `TODO` comments in `server/config.js`, `server/ingest.js`, `server/query.js`.

### Running the backend (once implemented)

```bash
cp .env.example .env   # fill in the keys
npm install
node server/index.js
```

The React frontend (`npm run dev`) will call this server's `/api/ask` endpoint — it never talks to any AI provider directly.
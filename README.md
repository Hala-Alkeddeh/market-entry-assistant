# Bosla

**Your compass to the Syrian market.**

An AI-powered decision-support tool for entrepreneurs and investors entering the Syrian market. Every answer is grounded strictly in a private, verified library of legal and business sources — never from the model's general knowledge. It doesn't replace a lawyer; it prepares you to talk to one.

**Live demo:** https://bosla-syria.vercel.app/

**Tech stack:** React + Vite · Express (Vercel serverless) · Google Gemini · Pinecone

---

## Status — Working MVP

- ✅ Source-grounded market-entry analysis, entry options, color-coded constraints, honest gaps, lawyer-ready summary
- ✅ Follow-up Q&A, fully bilingual (Arabic/English, RTL + LTR)
- ✅ Every answer cites its source (`[S1]`, `[S2]`...); says "not in sources" instead of inventing an answer
- ✅ Markdown-rendered output, deployed live on Vercel

## How it works

Profile → embedded & matched against Pinecone (retrieval always runs in English) → Gemini generates a grounded, cited answer → rendered in the user's chosen language → follow-ups answered the same source-grounded way.

---

<details>
<summary><strong>Project structure</strong></summary>

```
/server
  app.js       — pure Express app (routes only; no listen(), no static serving).
                 Shared by both local dev and the Vercel serverless function.
  index.js     — local-dev entrypoint: wraps app.js, serves the built frontend
                 statically, and calls listen().
  config.js    — loads and validates environment variables from .env
  ingest.js    — indexing pipeline: /sources files → text → chunks → embeddings
                 → Pinecone. Run manually whenever source files change.
  query.js     — retrieval + generation: builds the retrieval query, fetches
                 matches from Pinecone, calls Gemini, returns the grounded answer.

/api
  index.js     — Vercel serverless entrypoint; re-exports the same app.js used
                 locally, so there is a single source of truth for the API.

/src           — React frontend (Vite)
/sources       — reference source files indexed by ingest.js (English; not
                 committed to git if they contain licensed/sensitive material —
                 check your .gitignore)

vercel.json    — routes /api/* to the serverless function (maxDuration: 60s),
                 serves the built frontend for everything else.
```

</details>

<details>
<summary><strong>Knowledge base language</strong></summary>

The knowledge base is fully translated into English (from originally Arabic legal/business sources) for retrieval accuracy and consistency. Retrieval always runs in English:

- Profile-based structural query fields are mapped to English before embedding.
- Free-text input and follow-up questions are translated to English pre-retrieval when needed (with a safe fallback to the original text if translation fails).
- The final answer is still generated in whichever language the user selects (Arabic or English) — only the retrieval step is English-normalized.

Article/decree numbers and legal identifiers are preserved inline in the translated sources for traceability back to the original Arabic legal text.

</details>

<details>
<summary><strong>Running locally</strong></summary>

```
cp .env.example .env   # fill in the keys below
npm install
npm run dev             # Vite dev server + local Express backend
```

or, to run the production-style local server (serves the built frontend + API from one port):

```
npm run build
node server/index.js
```

**Environment variables**

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (generation + embeddings) |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Name of the Pinecone index to query/ingest into |
| `USE_MOCK` | Set to `false` for real Gemini/Pinecone calls; `true` uses mocked responses for local UI development without consuming API quota |

The frontend never talks to Gemini or Pinecone directly — all calls go through the backend (`/api/analyze`, `/api/followup`), so API keys are never exposed to the client.

**Re-indexing the knowledge base** — whenever a file in `/sources` changes:

```
node server/ingest.js
```

</details>

<details>
<summary><strong>Deployment (Vercel)</strong></summary>

1. Import the repo on [vercel.com](https://vercel.com) — `vercel.json` is auto-detected.
2. Add the four environment variables above in **Project Settings → Environment Variables**.
3. Deploy. `/api/*` routes to the serverless function (60s max duration); everything else serves the built frontend with SPA fallback.

</details>

---

## Design principles

- **Grounded, not generative** — every claim traces to a real, cited source.
- **Honest by default** — announced-but-unexecuted figures, opaque fees, and unverifiable claims are labeled as such.
- **Bilingual, not translated-as-an-afterthought** — Arabic and English are both first-class output languages.
- **A first step, not a replacement** — Bosla prepares the user for a lawyer; it does not offer legal advice.
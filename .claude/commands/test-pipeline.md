---
description: Hit the local /api/generate endpoint with a sample concept and pretty-print the per-platform outputs
argument-hint: [music concept prompt]
allowed-tools: Bash(curl:*), Bash(pnpm:*), Bash(jq:*)
---

Smoke-test the generation pipeline end to end against the running dev server.

Concept to use: **$ARGUMENTS** (if empty, use "lo-fi synthwave for late-night coding, nostalgic and warm").

## Steps

1. Confirm the dev server is up on http://localhost:3000 (if not, tell the user to run `pnpm dev`).
2. POST to `/api/generate`:
   ```bash
   curl -s -X POST http://localhost:3000/api/generate \
     -H 'Content-Type: application/json' \
     -d '{"prompt":"<concept>","target_platforms":["spotify","tiktok","youtube"]}' | jq
   ```
3. Verify each requested platform is present in the response and matches its schema.
4. Fire the request 4× in a row to confirm the **3/min rate limit** kicks in on the 4th (expect HTTP 429).
5. Summarize: which platforms returned, whether any came from the fallback cache, and whether rate limiting behaved.

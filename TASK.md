# Melotech — Full-Stack Case Study

> **Time:** 1 day &nbsp;•&nbsp; **Submitted via:** GitHub

Don't overthink it. A working MVP beats a perfect unfinished product. We care about how you think and ship, not perfection.

## The Brief

Melotech distributes AI-generated music across 50+ platforms globally. Each platform has different requirements — some need short clips, some need metadata in specific formats, some target specific moods or genres per region.

**Your task:** build a content distribution pipeline that takes a raw music concept and prepares it for multi-platform delivery.

## Backend

- Endpoint accepts:

  ```json
  { "prompt": "...", "target_platforms": ["spotify", "tiktok", "youtube"] }
  ```

- For each platform, generate a different optimized output using an LLM:
  - **Spotify** → full metadata (title, genre, mood, BPM, instruments, description)
  - **TikTok** → short hook description + 3 trending hashtags
  - **YouTube** → SEO-optimized title + description + tags
- Store results with platform metadata
- Return all three simultaneously

## Frontend

- Platform selector (multi-select)
- Side-by-side comparison view of outputs per platform
- Generation history with platform filter

## Constraints

- **Rate limiting** — no more than 3 generations per minute
- **Handle API errors gracefully** — if the LLM call fails, return a cached similar result

## Required

- Include a `CLAUDE.md` documenting how you used AI coding tools during the build

## Bonus

- Deploy it anywhere (Vercel, Railway, etc.)
- Add any creative feature you think fits Melotech's product

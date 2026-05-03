# Individual Development Plan — Sebastián Soto

Interactive web presentation built with **PretextJS**, **Bun**, and vanilla HTML/CSS/JS.

## Stack

| Layer | Tool |
|-------|------|
| Runtime | Bun |
| Text Layout | `@chenglou/pretext` (esm.sh) |
| Dev Server | Bun.serve |
| CI/CD | GitHub Actions → GitHub Pages |
| Testing | Bun test runner |

## Sections

1. **Hero** — Full-viewport landing with PretextJS-powered responsive typography
2. **Technologies** — Python, Jenkins, SVN, Git, Linux, Docker
3. **Udemy Courses** — 3×3 grid (placeholders)
4. **Achievements** — 5 items (placeholders)
5. **Behaviors** — 3 items (placeholders)
6. **Plans** — Short / Mid / Long term
7. **Roadmap** — Phase 1 / Phase 2 / Phase 3

## Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # outputs to dist/
bun run test     # run all tests
```

## Tests

- **links**: verify all internal assets exist
- **html**: validate structure and completeness
- **content**: verify all required sections are present

## Deploy

Pushes to `main` automatically build, test, and deploy to GitHub Pages.

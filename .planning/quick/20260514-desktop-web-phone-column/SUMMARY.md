---
status: complete
date: 2026-05-14
slug: desktop-web-phone-column
---

Added `src/global.scss` rules: from `min-width: 480px`, `app-root` flex-centers; `ion-app` gets `max-width: 430px` (CSS var `--app-web-max-width`), full viewport height, gutter background from `--ion-background-color`, light border/shadow. Narrow viewports unchanged.

`npm run build` still fails repo-wide on `book-placeholder.page.scss` budget (pre-existing).

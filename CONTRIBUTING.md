# Contributing to Zaad

1. Install Node 24 and run `npm ci`.
2. Create a focused branch; keep user-facing strings Arabic and components RTL-aware.
3. Use CSS logical properties. Test keyboard focus, reduced motion, narrow viewports and long ingredient names.
4. Add meaningful domain tests for state, dates, quantities and data boundaries. Do not add fake integrations or default user records.
5. Run `npm run format`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`.
6. Explain the user-visible change and include actual validation results in the pull request. Use only synthetic data in screenshots and fixtures.

The application intentionally needs no `.env` or paid services. Backend, cloud sync and hosting changes should be discussed as separate product decisions.

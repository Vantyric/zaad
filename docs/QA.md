# Verified quality record

Validation performed on **12 November 2026**. This document records commands and observations actually completed for release 1.0.1; it does not claim a full security audit or a measured reduction in household waste.

## Environment

- macOS ARM64, Node.js **24.18.0**, npm **11.16.0**.
- React **19.3.1**, TypeScript **6.0.3**, Vite **8.3.8**.
- Vitest **5.1.0**; Playwright **1.65.0**, bundled Chromium **158.0.8127.18** using the `chromium` channel.
- Browser tests use locale `ar-IQ`, timezone `Asia/Baghdad` and reduced motion.
- Desktop viewport **1440 × 1000**; mobile emulation **390 × 844**. Additional layout checks cover **320px**, **768px**, **720px with CSS zoom 2**, and print media.

## Final local results

| Check                  | Actual result                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`               | Passed; clean install from the committed lockfile                                                                          |
| `npm run lint`         | Passed without warnings                                                                                                    |
| `npm run typecheck`    | Passed                                                                                                                     |
| `npm run format:check` | Passed                                                                                                                     |
| `npm test`             | **61 passed**, 2 files                                                                                                     |
| `npm run build`        | Passed; static production output in `dist/`                                                                                |
| `npm run test:e2e`     | **26 passed** across desktop and mobile Chromium; final run 15.5s                                                          |
| `npm audit`            | **0 known vulnerabilities**, including development dependencies                                                            |
| `npm audit --omit=dev` | **0 known vulnerabilities** in production dependencies                                                                     |
| axe-core scans         | **0 detected violations** for WCAG 2 A/AA and WCAG 2.1 AA rules on five screens plus the editor, in both viewport projects |
| Development server     | Vite started successfully on loopback; application loaded and editor interaction was verified in the in-app browser        |

## Three main acceptance journeys

1. **Manage inventory:** create an ingredient, edit its quantity, reload and verify persistence, search using an unaccented Arabic alef, combine category and location filters, view no-results state, clear filters, cancel deletion, then confirm deletion. Passed on both viewports.
2. **Use and replenish:** record partial consumption and verify remaining quantity, finish the stock, inspect two real history events, find the depleted ingredient in shopping, edit its requested amount, mark it purchased, confirm clearing completed purchases and verify history remains. Passed on both viewports.
3. **Backup and restore:** download and parse the real exported JSON, reject malformed input without altering data, preview a valid import and cancel, explicitly reset, restore the original backup and verify persistence after reload. Passed on both viewports.

## Additional browser checks

- Blank and negative input feedback; initial form focus; Tab wraps inside the modal; Escape closes it and returns focus.
- Skip link moves focus to the current screen's content while preserving that screen.
- Corrupt localStorage remains untouched; ordinary editing is blocked until explicit recovery. Cancelling reset preserves the original bytes.
- Simulated quota failure leaves inventory usable in memory, displays a storage warning and exports the unsaved data correctly.
- Same-origin browser tabs receive an actual storage update. Runtime asset requests stay on the local application origin; no page errors were detected in that flow.
- An HTML-shaped ingredient name is rendered as inert text, not an image or executable markup. Oversized imports are rejected.
- RTL language attributes, responsive horizontal fit, reduced-motion scroll behavior and printable shopping styles.

## Visual review and improvements

Screens were planned in [PRODUCT.md](PRODUCT.md) before implementation. Actual desktop, mobile and editor screenshots were reviewed. The visual pass increased small type and foreground contrast, corrected the add-button wording after first use, and verified the mobile navigation, custom SVG illustrations and form layout. Native dialogs gained explicit initial focus and Tab wrapping after observed failures.

The default headless-shell runner stalled during frame-stability checks on this Mac. Switching to the documented full Chromium headless channel resolved the rendering issue. Early tests also revealed a delayed navigation-focus conflict with the skip link; that behavior was fixed and the final test passed. An entrypoint hot-reload issue was corrected by moving the lazy root into its own component and disposing the root cleanly. Test-report folders are excluded from Vite watching.

Screenshots under `docs/screenshots/` are browser captures of the shipped UI using opt-in fictional pantry data, synthetic consumption/disposal records and a synthetic shopping list. They contain no real household records or personal details.

## 1.0.1 refinement pass

This patch keeps the same five product capabilities and the version-1 backup format. No backend, data migration or new product module was added.

- Readability: centralized caption/body/input sizing, larger secondary text and fields, clearer card titles and date labels.
- Layout: a shorter populated-pantry introduction, two-column cards at tighter desktop widths, stable mobile navigation while scrolling and better long-name/note wrapping.
- Interaction: 44px edit/delete/use targets on mobile; invalid fields receive focus; the hidden import file input no longer creates an invisible keyboard stop.
- Feedback: success notifications expire after eight seconds, pause on hover or focus, and remain manually dismissible. Errors remain visible until dismissed.
- Maintainability: shopping, activity and data screens are separated under `src/pages/`; shared view types live in `src/lib/ui.ts`; repeated number, date and name-collation formatters are reused. The main application file fell from 829 to 514 lines without changing record storage.
- Regression verification: all original 22 browser cases still passed. Four additional desktop/mobile cases cover maximum-length unbroken names, large fractional quantities, long notes, touch-target size and notification timing. Existing keyboard and backup scenarios now also check invalid-field focus and the import-button tab order.
- Screenshots were recaptured from the production build with the same synthetic data workflow. The UI was also reviewed in the in-app browser.

## Verification limits

- Mobile results are browser emulation, not a physical Android/iPhone device test.
- CSS zoom exercises a constrained enlarged layout; native browser/OS text scaling was not manually audited.
- Firefox, Safari, screen readers, Lighthouse and concurrent multi-device edits were not tested. Automated axe scans do not establish complete WCAG conformance.
- The user has now authorized public website publication. Deployment and live checks are separate from local test success and are reported with the actual deployment result. Data remains browser-local with last-write-wins between same-origin tabs.
- The repository includes a real GitHub Actions workflow. Remote CI status is reported separately after the initial push and is visible in GitHub Actions.

# Zaad — product and screen plan

## Problem and audience

Arabic-speaking households and students sharing a kitchen need a quick way to see what is already at home, prioritize upcoming dates, and avoid duplicate purchases. Zaad is a personal household tool, not a marketplace or a shared inventory service.

Household food waste is a documented community problem: [UNEP Food Waste Index Report 2024](https://www.unep.org/resources/publication/food-waste-index-report-2024). The specific workflow and design are product hypotheses; no user interviews or measured impact are claimed.

## Candidate comparison (1–5; higher is better)

| Concept                          | Usefulness | Distinctiveness | Feasibility | Visual potential |
| -------------------------------- | ---------- | --------------- | ----------- | ---------------- |
| Zaad / household pantry          | 5          | 4               | 5           | 5                |
| Khutwa / focused study planner   | 4          | 3               | 5           | 4                |
| Dar / home maintenance organizer | 4          | 4               | 5           | 4                |

Zaad wins on immediate usefulness and a complete, server-free scope. The third candidate was replaced with Dar at the user's request. The accessible GitHub account was checked; its existing repositories covered fraud awareness and a corporate website, not pantry management. No private repository content is copied.

## Five core capabilities

1. Pantry CRUD with quantity, unit, category, location, optional label date and notes.
2. Arabic-aware search, category/location/status filters and sorting by urgency or name.
3. A date-priority view, partial consumption/discard records and an honest activity history.
4. A shopping checklist, including adding a depleted ingredient, editing, buying and removing items.
5. Validated JSON backup/restore, printable shopping list and local persistence with error recovery.

## Screens planned before implementation

- **My pantry (default):** right-hand desktop brand/navigation rail; greeting and date; green editorial hero with original SVG pantry illustration; real derived counters; urgency strip; searchable filterable item grid. First run starts empty with explicit opt-in fictional demo data.
- **Use first:** focused urgency queue using the same item cards and consume flow; expired label dates remain distinct from upcoming dates. Dates are reminders, never food-safety verdicts.
- **Shopping:** one compact add form, active and checked items, inline edit flow, clear completed confirmation, print action.
- **Activity:** real use/discard records grouped in reverse chronological order; no fabricated savings or environmental metrics.
- **Data & privacy:** readable local-storage explanation, download backup, validate/preview import before replacement, explicit reset confirmation.
- **Dialogs:** accessible item editor, partial consumption, item deletion, import confirmation. Native modal dialogs provide focus containment, Escape support and return focus.

## Visual system

Deep forest ink, warm ivory canvas, restrained apricot/citrus accents. Self-hosted Noto Sans Arabic variable font. Generous whitespace, logical CSS properties, original flat SVG food art, clear outlines, soft purposeful transitions. No remote photos, external fonts, account avatars, fake social proof or sample numbers on first run.

Desktop: fixed 224px rail, fluid main, 3-column cards. Tablet: compact rail and 2-column cards. Mobile: brand header, horizontally scrollable navigation and one-column cards, comfortable touch targets. Respect reduced motion and 200% zoom. All status meanings include text, not color alone.

## Technical and privacy decisions

React + TypeScript + Vite; Zod validates persisted data and imports; localStorage only. No backend, keys, telemetry or network integrations. Storage failure is visible. Corrupt storage is protected from overwrite until recovery. JSON imports have a 1 MB and 500-record-per-collection limit and require an explicit preview confirmation. Runtime state is never committed.

No external hosting deployment is authorized. Public GitHub publication of this new project's code is authorized, subject to checking the destination account, secrets and final checks.

## Acceptance scenarios

1. Add an ingredient, edit it, reload, search/filter it, delete it with confirmation.
2. Record partial and final consumption, inspect real history, move depleted name to shopping, edit and check purchase.
3. Export, reject malformed/oversized backups, preview and restore a valid backup; verify storage failures and keyboard/RTL/mobile behavior.

## Deferred

Cross-device sharing/authentication, barcode recognition, recipe recommendations and push notifications. No placeholder controls for these features are shipped.

## 1.0.1 quality refinement

The user requested improving the current product without new features. This pass preserves the five capabilities and local data format, and focuses on readable type, compact populated-pantry presentation, mobile navigation/touch targets, long-text reflow, validation focus, unobtrusive success feedback and smaller screen modules.

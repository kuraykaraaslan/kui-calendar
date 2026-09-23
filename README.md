# kui-calendar

[![npm](https://img.shields.io/npm/v/@kuraykaraaslan/kui-calendar.svg)](https://www.npmjs.com/package/@kuraykaraaslan/kui-calendar)
[![license](https://img.shields.io/npm/l/@kuraykaraaslan/kui-calendar.svg)](./LICENSE)

A standalone calendar / scheduler component built on **React 18/19**, **Zustand** and **Tailwind CSS v4**. Ships a framework-agnostic TypeScript core (`CalendarEngine`) plus a batteries-included React subpath.

> **Status**: early-stage (`0.0.1`). Public API is unstable; expect breaking changes between patch versions until `0.1.0`.

---

## Features

- **Five views** — month, week, day, agenda, and resource (per-resource columns)
- **RRULE recurrence** — `DAILY`/`WEEKLY`/`MONTHLY`/`YEARLY` with `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`, plus per-occurrence exceptions
- **Drag interactions** — drag-create, move, and resize on time-grid views, with snap-to-slot (5/15/30/60 min)
- **Multi-calendar federation** — toggle event sources on/off via the calendar legend
- **i18n** — built-in English + Turkish bundles, overridable messages, locale-aware week start
- **Keyboard navigation** + ARIA live regions for accessibility
- **Working hours** shading and configurable time slots
- **Telemetry hook** — a single `onTelemetry` callback for nav / view / event lifecycle events
- Framework-agnostic core: Zustand vanilla store, no React imports below `react/`
- Strict TypeScript throughout

---

## Install

```bash
pnpm add @kuraykaraaslan/kui-calendar react react-dom zustand
```

`react`, `react-dom` and `zustand` are **peerDependencies**. `react`/`react-dom` are marked optional so the vanilla core can be consumed without React.

---

## Quick start — React

```tsx
import { Calendar } from "@kuraykaraaslan/kui-calendar/react";
import type { CalendarEvent, View } from "@kuraykaraaslan/kui-calendar/react";
import "@kuraykaraaslan/kui-calendar/styles.css";
import { useState } from "react";

const events: CalendarEvent[] = [
  { id: "1", title: "Team standup", start: new Date(2026, 5, 8, 9, 0), end: new Date(2026, 5, 8, 9, 30), color: "primary" },
  { id: "2", title: "Weekly sync", start: new Date(2026, 5, 1, 10, 0), end: new Date(2026, 5, 1, 10, 30), rrule: "FREQ=WEEKLY;BYDAY=MO" },
];

export default function App() {
  const [view, setView] = useState<View>("month");

  return (
    <div className="h-screen p-4">
      <Calendar
        events={events}
        view={view}
        onViewChange={setView}
        workingHours={{ start: 9, end: 18, days: [1, 2, 3, 4, 5] }}
        slotMinutes={30}
        recurrence
        onEventCreate={(range) => console.log("create", range)}
        onEventUpdate={(event) => console.log("update", event)}
        onEventDelete={(id) => console.log("delete", id)}
      />
    </div>
  );
}
```

Import `styles.css` **once** at your app root — it ships the compiled Tailwind v4 design tokens the component depends on.

---

## Quick start — vanilla TypeScript

The `CalendarEngine` holds the Zustand vanilla store and locale resolution with no React dependency — mirroring the role of the `Viewer` class in [`@kuraykaraaslan/kui-viewer`](https://www.npmjs.com/package/@kuraykaraaslan/kui-viewer).

```ts
import { CalendarEngine } from "@kuraykaraaslan/kui-calendar";
import type { CalendarEvent } from "@kuraykaraaslan/kui-calendar";

const engine = new CalendarEngine({ view: "week", locale: "en" });

engine.setView("month");
engine.navigate("next");

console.log(engine.getPeriodLabel());      // e.g. "July 2026"
console.log(engine.getVisibleWindow());    // [Date, Date]

// expand recurring events into concrete occurrences for the visible window
const occurrences = engine.expandOccurrences(events);

// subscribe to store changes
const unsub = engine.store.subscribe((s) => console.log(s.view, s.date));

engine.dispose();
unsub();
```

---

## Recurrence

Pass an iCalendar [`RRULE`](https://datatracker.ietf.org/doc/html/rfc5545) string on any event and set the `recurrence` prop on `<Calendar />`; occurrences are expanded lazily, only for the visible window. Expansion is **off by default**: without `recurrence`, a recurring event is shown once, at its own `start`. (In the vanilla core, `engine.expandOccurrences(events)` always expands.)

```ts
{ id: "e", title: "Standup", start, end, rrule: "FREQ=DAILY;INTERVAL=1;COUNT=10" }
{ id: "w", title: "Sync",    start, end, rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231" }
```

Supported tokens: `FREQ` (`DAILY`/`WEEKLY`/`MONTHLY`/`YEARLY`), `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`. Cancel a single instance by adding its date to the event's `exceptions: Date[]`.

---

## API — `<Calendar />`

| Prop | Type | Notes |
|---|---|---|
| `events` | `CalendarEvent[]` | required |
| `view` | `'month' \| 'week' \| 'day' \| 'agenda' \| 'resource'` | controlled view |
| `defaultDate` | `Date` | initial date (uncontrolled) |
| `resources` | `Resource[]` | columns for the resource view |
| `calendars` | `CalendarSource[]` | event sources for the legend |
| `recurrence` | `boolean` | enable RRULE expansion (default `false`: a recurring event shows once, at its `start`) |
| `locale` | `string` | `'en'` or `'tr'` (defaults to `tr`) |
| `messages` | `Partial<CalendarMessages>` | string overrides |
| `workingHours` | `{ start, end, days }` | shaded hours on grid views |
| `slotMinutes` | `5 \| 15 \| 30 \| 60` | snap granularity |
| `onViewChange` / `onDateChange` | `(v) => void` | navigation callbacks |
| `onEventClick` / `onEventCreate` / `onEventUpdate` / `onEventDelete` | callbacks | create/update/delete may return a `Promise` |
| `onCalendarToggle` | `(id, visible) => void` | legend toggles |
| `onTelemetry` | `(e: CalendarTelemetry) => void` | unified event stream |
| `className` | `string` | root element class |

The component also forwards a `CalendarHandle` (`goToToday`, `goPrev`, `goNext`, `setView`) for imperative control.

---

## Exports

| Specifier | Contents |
|---|---|
| `@kuraykaraaslan/kui-calendar` | Vanilla core: `CalendarEngine`, `createCalendarStore`, RRULE helpers, date utils, color/locale helpers, and all types |
| `@kuraykaraaslan/kui-calendar/react` | React `<Calendar />` + `<MiniCalendar />` and component types |
| `@kuraykaraaslan/kui-calendar/styles.css` | Compiled Tailwind v4 tokens. Import once at the app root |

---

## Stack

- [React](https://react.dev/) 18 / 19 (peer)
- [Zustand](https://github.com/pmndrs/zustand) v5 (vanilla store)
- [Tailwind CSS](https://tailwindcss.com/) v4 (design tokens)
- [Font Awesome](https://fontawesome.com/) (event icons)
- [`clsx`](https://github.com/lukeed/clsx) + [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) (`cn()` helper)

---

## Development

```bash
pnpm install
pnpm dev          # Vite playground at http://localhost:5173
pnpm build        # JS + .d.ts + styles.css → dist/
pnpm typecheck    # tsc --noEmit against the library config
pnpm test         # Vitest
```

---

## Project layout

- `modules/` — vanilla core (engine, store, RRULE, date utils, colors, locale). No React imports.
- `react/` — React subpath: `<Calendar />`, `<MiniCalendar />`, views, parts, and hooks.
- `libs/` — cross-cutting utilities (`cn()`).
- `src/` — Vite dev playground (not bundled into the published package).
- `scripts/` — build helpers (`build-css.mjs`).

---

## License

[Apache-2.0](./LICENSE) © 2026 Kuray Karaaslan

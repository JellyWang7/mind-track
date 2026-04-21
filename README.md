# Mind Track

A tiny, local-first web app for daily mental-health check-ins. Built around three public CBT worksheets — no server, no account, no network calls. Your data stays in your browser.

![badge: vanilla](https://img.shields.io/badge/stack-vanilla_HTML%2BJS-4a7c74)
![badge: storage](https://img.shields.io/badge/data-localStorage-4a7c74)
![badge: license](https://img.shields.io/badge/license-MIT-4a7c74)

## Why

Most mood-tracking apps want a login, a subscription, and your data. I just wanted something simple enough to use for **30 seconds a day** and stop.

Mind Track is a single folder of three files. Open `index.html`, write a thought, close the tab. That's it.

## What's inside

Three classic CBT tools, one tab each:

| Tool | Source worksheet | What it captures |
|------|------------------|-------------------|
| **Thought Record** | *Simple Thought Record* — Psychology Tools | Situation · feeling · intensity (0–100) · thought |
| **Worry Time** | *Scheduling Worry Time* — Mindfulness Exercises | Daily worry window · "parked" worries · session reflection |
| **Talking Back** | *Talking Back Guide* — Dr. Mimi | Thought → validity · utility · compassion · reframe |

Plus:

- **Today** tab — date header, 7-day average-intensity bar chart, today's entries
- **History** tab — filter by type, delete, **export / import JSON** for backup

## Quick start

### Easiest

```bash
open /Users/Jelly1/Documents/my-app/mind-track/index.html
```

### Via local server (recommended if your browser restricts `file://`)

```bash
cd /Users/Jelly1/Documents/my-app/mind-track
python3 -m http.server 8787
# then visit http://localhost:8787
```

### Bookmark it

In the browser, **⌘+D** the URL (or `file://…/index.html`) so it's one click from the bookmarks bar.

## How to use it

1. **Set your worry time once** — Worry Time tab → pick a start + duration, Save.
2. **During the day**, when a worry shows up, open the Worry Time tab and **park** it. Tell yourself: "see you at worry time."
3. **When the window arrives**, dive in fully for 30 min; when done, write a short reflection.
4. **Any time a harsh thought shows up**, open **Talking Back** and answer the four prompts. The reframe is the point.
5. **Once a day** (evening works well), log one **Thought Record** to feed the 7-day chart.

## Architecture

```
mind-track/
├── index.html     Markup + tabs + forms (no templating)
├── styles.css     Calm light/dark theme (prefers-color-scheme)
├── app.js         State, localStorage, rendering, 7-day chart, export/import
└── README.md
```

- **State** is a single object kept in `localStorage` under the key `mindTrackData.v1`:

  ```js
  {
    settings: { worryStart: "18:00", worryMins: 30 },
    entries: [
      { id, type, createdAt, fields }
    ]
  }
  ```

- **`type`** is one of `thought` · `worry_capture` · `worry_session` · `talkback`.
- **Chart** is pure CSS — no libraries. Bars are averaged `thought.intensity` per day for the last 7 days.
- **Export / import** is plain JSON; import merges by `id` to avoid duplicates.

## Privacy

- **No network requests.** Open DevTools → Network tab → refresh. You'll see nothing.
- **No account.** `localStorage` is scoped per origin (`file://` or `http://localhost:8787`).
- **Clearing browser storage wipes the data.** Use **Export JSON** occasionally; you can reimport later.

## Data portability

- **Export** — History tab → "Export JSON". Downloads `mind-track-YYYY-MM-DD.json`.
- **Import** — History tab → "Import JSON". Adds any entries not already present (matched by `id`).
- **Clear all** — deletes everything in storage (asks first).

## Roadmap (maybe)

- Keyboard shortcut to jump to each tab (`1`–`5`)
- Optional reminder at worry time (browser notification API)
- Tag / free-text search in History
- Monthly summary export (PDF / Markdown)

None of this is required. The app is intentionally finished enough to be useful today.

## Credits

- Psychology Tools — *Simple Thought Record*
- Mindfulness Exercises — *Scheduling Worry Time*
- Dr. Mimi — *Talking Back Guide* (Bi on Life Series)

## Not medical advice

Mind Track is a personal journaling tool inspired by public CBT worksheets. It is **not** therapy, diagnosis, treatment, or a replacement for professional care. If you are in crisis, contact your local emergency services or a mental-health hotline.

## License

[MIT](./LICENSE)

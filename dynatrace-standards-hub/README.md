# UdaPeople Control Tower

A Dynatrace custom app (built with the [App Toolkit](https://developer.dynatrace.com/develop/app-toolkit/)) that
gives UdaPeople engineers one place to find an architectural standard, understand why it exists, see where it
already applies in this repo, and follow exact steps to build the Dynatrace monitor, SLO, or Workflow that
operationalizes it.

## The metaphor: five towers

Standards are grouped into five **Control Towers** instead of one flat list, so the grouping itself tells you
something about the kind of decision you're making:

| Tower | Emoji | Covers |
|---|---|---|
| Launch Tower | 🛫 | CI/CD pipeline standards — build, test, scan, gate |
| Foundation Tower | 🏗️ | Infrastructure-as-code standards — CloudFormation, Ansible, tagging |
| Radar Tower | 🛰️ | Observability & reliability standards — monitors, SLOs, Davis AI, dashboards |
| Vault Tower | 🔐 | Security & compliance standards — secrets, access, transport |
| Recovery Tower | 🪂 | Release, rollback & data standards — blue-green, migrations, automatic rollback |

Each standard also carries a **maturity level** — `Foundational` (do this first) or `Advanced` (level up once the
foundationals are solid) — as a second axis, so a tower page doubles as a rough adoption roadmap, not just a
category list.

Every standard is grounded in this repo: it names the real CircleCI job, CloudFormation template, or file where
it already applies (see `ui/app/data/standards.ts`), and links to it on GitHub. Nothing here is generic
boilerplate — it's UdaPeople's own pipeline and infrastructure, described as rules.

## What each standard page gives you

- **Standard** — the rule itself, phrased as a "shall" statement.
- **Why** — the failure mode it prevents.
- **How to verify** — what a reviewer or the engineer themself checks.
- **Where this applies today** — links into the actual repo files/jobs.
- **Build this in Dynatrace** — concrete steps (which app to open, what to create) to turn the standard into a
  live monitor, SLO, Guardian, Workflow, or dashboard tile, including example DQL where relevant.

A checkbox on every standard card marks it "adopted in this repo." That state is shared across the tower list,
the standard's own page, and the **Adoption Checklist** page — it's stored in the browser (`localStorage`), so
it's a personal working checklist, not a synced database. The Checklist page can also copy a Markdown summary
(a `- [x] LT-01 ...` list per tower) to paste into a PR description or a team doc.

## Project layout

```
dynatrace-standards-hub/
  app.config.json.example   # copy to app.config.json and fill in your environment URL
  package.json
  ui/
    main.tsx                # entry point, wraps App in AppRoot + BrowserRouter
    tsconfig.json
    app/
      App.tsx                # PageLayout + AppHeader + routes
      styles.css
      types.ts                # Tower / Standard / DynatraceGuidance shapes
      data/
        towers.ts             # the 5 towers
        standards.ts          # the standards catalog — edit this to add/change a standard
      components/
      pages/
      utils/adoption.ts       # localStorage-backed adoption checklist
```

## Running it

This app was scaffolded by hand to match the official `dt-app` App Toolkit project layout (verified against the
[`Dynatrace/dt-app-templates`](https://github.com/Dynatrace/dt-app-templates) `empty` template), so the standard
toolkit workflow applies:

```bash
cd dynatrace-standards-hub
cp app.config.json.example app.config.json
# edit app.config.json: set environmentUrl to your Dynatrace environment
npm install
npm run start     # dt-app dev — local dev server with live reload
npm run lint       # eslint
npm run build      # dt-app build — production bundle in dist/
npm run deploy     # dt-app deploy — installs/updates the app on your environment
```

`app.config.json` is gitignored on purpose — it's environment-specific and shouldn't be committed. Only
`app.config.json.example` is tracked.

> This scaffold has not been run against a live Dynatrace environment or the `dt-app` CLI from this session (no
> Dynatrace tenant or toolkit install was available here). The file layout, `app.config.json` shape, and
> dependency versions were verified against the official `dt-app-templates` repository, but you should still run
> `npm install && npm run lint && npm run build` locally before treating it as a working deploy.

## Extending it

- **Add a standard**: append an object to the `standards` array in `ui/app/data/standards.ts`. The UI (tower
  page, standard page, checklist, search, filters) is fully data-driven — no other file needs to change.
- **Add a tower**: append to `ui/app/data/towers.ts`. It'll automatically show up on the home page, in the nav
  bar, and as a filterable group.
- **Wire in live data**: `@dynatrace-sdk/client-query` is already a dependency. A natural next step is a
  dashboard-style page that runs the DQL snippets already attached to each standard's guidance and shows real
  pass/fail state instead of just the recipe for building it.

## Why a Dynatrace app instead of a wiki page

The standards that matter most here aren't just "write it down" rules — they're rules about what to *build* in
Dynatrace. Putting the catalog inside a Dynatrace app, next to the Synthetic Monitors, Guardians, and Workflows
it references, keeps the standard and the tool to enforce it one click apart instead of a context-switch apart.

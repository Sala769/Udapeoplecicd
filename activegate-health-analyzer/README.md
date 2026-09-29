# ActiveGate Health Analyzer

Dynatrace Platform App (dt-app, Strato). Upload an ActiveGate support archive; it is parsed in the browser, matched against an editable known-issues KB, and combined with live `dsfm:active_gate.*` metrics from Grail.

- KB rules: `ui/app/lib/knownIssuesKb.json` (regex `pattern`, root cause, resolution, RFA flag).
- Sizing thresholds: `ui/app/lib/sizingConfig.json` (verify against current Dynatrace docs).
- Metric keys and entity dimension: `ui/app/lib/dqlQueries.ts` (confirm in Metric Browser; the entity dimension is assumed to be `dt.entity.active_gate`).
- Assist skill: `dynatrace-intelligence/skills/activegate-health/SKILL.md`.

Commands: `npm install`, `npm run start`, `npm run build`, `npm run lint`, `npm run deploy` (set `environmentUrl` in `app.config.json` first).

## Not yet done / to verify
- Embedded Assist chat (`invokeInlineAgent`) is not implemented: the SDK is not public. The Assist page shows copyable context instead.
- Archive layout is inferred (gateway.log*, *.properties, sysinfo, thread dumps); validate against a real support archive.
- Live charts and entity lookup were not exercised against a tenant.
- Report saving to Documents (`document:documents:write`) is not implemented.
- The scaffold ships React 18, not 19.

---
name: activegate-health
description: Explain ActiveGate log errors, JVM heap/GC patterns and load findings, and suggest safe next steps. Use when a user asks what an ActiveGate error or memory pattern means.
---

# ActiveGate health playbook

Ground answers in the findings of the ActiveGate Health Analyzer app. Never state a root cause as certain when only a pattern matched; say what to verify.

## Error signatures
- `CPU does not support x86-64-v3`: container image moved to a RHEL UBI 10 micro base (Sprint 345). Verify host CPU; pin the previous AG version if hardware cannot change.
- `Neither systemd nor SystemV initialization script found`: service registration missing or corrupted. Recheck `dynatracegateway.service`; manual reinstall may be needed.
- `runuser: may not be used by non-root users` plus AVC denials after patching: SELinux policy misaligned. Use `audit2allow`; verify `/opt/dynatrace/gateway` ownership.
- `SunCertPathBuilderException` despite correct CA: an explicit `javax.net.ssl.trustStore` override bypasses the custom truststore. Remove it and restart.
- `Cannot forward request` (500) on containerized REST API module: known Apache HttpClient 5 bug (PRISM-5759). Confirm direct SaaS call works; RFA if not an exact match.
- `HTTP client cannot be created` behind a load balancer: TLS-terminating LB cert/SAN/cipher mismatch. Prefer L4 passthrough.
- `Tenant phase: 3` with VMware/Azure/DB Insights/AWS/Memory Dump/Cloud Foundry modules: these will not load; plan migration.
- `ActiveGate Unavailable` on module save while the module works: broaden log scope beyond the module.

## Memory and load patterns
- Sustained Old Gen above 95% with -Xms far below -Xmx and no crash: G1GC may expand into new regions rather than compact. Check version/extension changes before raising -Xms.
- Erratic zig-zag heap: distinct from steady-high. Compare against version/extension changes; look for module reload loops.
- High self-monitoring % with low absolute traffic and no dropped messages is often a false positive. Judge against absolute values.

## Updates
A cluster upgrade makes new AG installers available regardless of the AG autoupdate window. EEC/module autoupdate (Synthetic, zRemote, Remote Plugins) is not gated by that window.

## Escalation
If unresolved, gather the support archive, heap dump if memory-related, and follow the ActiveGate RFA checklist.

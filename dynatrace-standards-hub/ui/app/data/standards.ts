import { Standard } from "../types";

/**
 * The standards catalog. Each entry ties a concrete rule back to a real
 * place in the UdaPeople repo (relatedRepoPaths) and forward to the
 * Dynatrace capability that operationalizes it (dynatrace). Add new
 * standards here — the UI is fully data-driven.
 */
export const standards: Standard[] = [
  // ---------------------------------------------------------------------
  // Launch Tower — CI/CD pipeline standards
  // ---------------------------------------------------------------------
  {
    id: "LT-01",
    towerId: "launch",
    title: "Build Once, Deploy the Same Artifact",
    maturity: "foundational",
    statement:
      "Every pipeline run builds frontend and backend from a clean checkout and caches the result by lockfile key. The artifact that passed tests is the artifact that gets deployed — never rebuilt at deploy time.",
    rationale:
      "Rebuilding at deploy time reintroduces the exact 'works in CI, breaks in prod' drift the pipeline exists to prevent.",
    verification:
      "build-frontend and build-backend populate the frontend-build / backend-build caches; every downstream job restores from that cache instead of reinstalling from scratch.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Deployment events + Synthetic HTTP monitor",
      steps: [
        "Open the Synthetic Monitors app and create an HTTP monitor against /api/status, tagged with the service name.",
        "In the CI pipeline, send a deployment event to Dynatrace (Events API v2) tagged with the same Workflow_ID used to build the artifact.",
        "On the service's timeline, overlay deploy markers on the synthetic result chart so a regression can be traced to the exact build that shipped it."
      ]
    }
  },
  {
    id: "LT-02",
    towerId: "launch",
    title: "Nothing Deploys Without Passing Tests",
    maturity: "foundational",
    statement:
      "No deploy job runs unless test-frontend and test-backend have both passed on the same commit in the same workflow.",
    rationale:
      "Fast feedback only matters if a red test actually blocks the pipeline — otherwise the gate is decorative.",
    verification:
      "The `requires` graph in the CircleCI workflow makes every deploy job depend, directly or transitively, on both test jobs.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Site Reliability Guardian (validation gate)",
      steps: [
        "Create a Site Reliability Guardian scoped to the backend service with an objective on error rate and response time.",
        "Add a Guardian validation step to the deploy Workflow that runs immediately after deploy-backend and before cloudfront-update.",
        "Treat a failed Guardian evaluation the same as a failed unit test: it blocks promotion, it doesn't just notify."
      ]
    }
  },
  {
    id: "LT-03",
    towerId: "launch",
    title: "Vulnerability Scans Gate the Pipeline, Auto-Fix Never Merges Blind",
    maturity: "advanced",
    statement:
      "scan-frontend and scan-backend fail the build on any critical vulnerability. `npm audit fix --force` may run in CI to show what a fix looks like, but its diff is reviewed by a human before it's trusted — it is never treated as an automatic pass.",
    rationale:
      "`--force` can bump major versions and silently break behavior; a green scan step after a forced fix is not the same thing as a safe fix.",
    verification:
      "scan-frontend / scan-backend jobs exit non-zero on `npm audit --audit-level=critical`, and any auto-fix commit is reviewed as a normal pull request, not fast-forwarded.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Log ingest + Custom Event for Alerting",
      steps: [
        "Ship the `npm audit` JSON output to Dynatrace via the Log Ingest API as a structured log line per build.",
        "Build a DQL query counting critical findings per build and pin it to a dashboard next to deploy frequency.",
        "Create a Custom Event for Alerting that fires when critical-finding count is greater than zero for two consecutive builds, so a recurring gap doesn't get lost in pipeline noise."
      ],
      dql: 'fetch logs\n| filter log.source == "npm-audit"\n| filter matchesValue(loglevel, "CRITICAL")\n| summarize count(), by:{bindings.service}'
    }
  },
  {
    id: "LT-04",
    towerId: "launch",
    title: "Every Pipeline Stage Emits a Signal Outside CircleCI",
    maturity: "advanced",
    statement:
      "Build, test, scan, deploy and smoke-test stages each emit a structured event to observability tooling — not just a green check in CircleCI's own UI.",
    rationale:
      "Pipeline health and production health need to live next to each other, or 'did the last deploy cause this?' stays a guess.",
    verification:
      "A curl step to the Dynatrace Events API v2 exists in (or is planned for) each pipeline stage, tagged with service, environment and Workflow_ID.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Events API v2 ingestion",
      steps: [
        "In each CircleCI job, add a `run` step that POSTs to `https://<environment>/platform/ingest/v1/events` (or the classic Events API v2 endpoint) with event.type, service, and CIRCLE_WORKFLOW_ID.",
        "Confirm the events show up on the service's timeline in the Dynatrace Services app, not just in a dashboard tile.",
        "Reuse these same events as the 'deploy markers' referenced by LT-01 and RC-02, so there is exactly one event stream, not three overlapping ones."
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Foundation Tower — infrastructure-as-code standards
  // ---------------------------------------------------------------------
  {
    id: "FT-01",
    towerId: "foundation",
    title: "One Template, Parameterized — Never Hand-Edited",
    maturity: "foundational",
    statement:
      "Backend and frontend infrastructure are defined once in CloudFormation and parameterized by Workflow ID. Nobody edits a running stack's resources by hand in the console.",
    rationale:
      "A console edit is invisible to the next `deploy` and gets silently overwritten or, worse, silently diverges from source.",
    verification:
      "backend.yml and frontend.yml take `ID` as a parameter; `deploy-infrastructure` always deploys via `aws cloudformation deploy`, never `aws cloudformation update-stack` with ad hoc arguments.",
    relatedRepoPaths: [".circleci/files/backend.yml", ".circleci/files/frontend.yml"],
    dynatrace: {
      monitorType: "Cloud integration + management zone",
      steps: [
        "Configure the AWS integration (Settings > Cloud and virtualization) so Dynatrace auto-discovers EC2 and S3 resources.",
        "Create a management zone scoped to resources tagged `project:udapeople` so engineers see only this stack's topology by default.",
        "Use Smartscape on that management zone as the visual source of truth for 'what does the current stack actually contain', cross-checked against the CloudFormation template."
      ]
    }
  },
  {
    id: "FT-02",
    towerId: "foundation",
    title: "Tag Everything, Orphan Nothing",
    maturity: "foundational",
    statement:
      "Every stack deploy passes `--tags project=udapeople`. The cleanup step must be able to find and remove every resource belonging to a superseded Workflow ID using that tag alone.",
    rationale:
      "Untagged resources are the ones that quietly keep costing money and widening the attack surface after a deploy is long forgotten.",
    verification:
      "`deploy-infrastructure` passes `--tags project=udapeople` on both stacks; `cleanup` can enumerate old stacks purely from CloudFormation state plus that tag.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Scheduled Workflow + DQL",
      steps: [
        "Build a Dynatrace Workflow on an hourly schedule that runs a DQL query for cloud resources missing the `project` tag.",
        "Add a notification action (Slack/email) to that Workflow so an untagged, orphaned resource gets reported instead of discovered during a cost review.",
        "Treat a failing 'zero orphans' check the same as a failing test: something to fix that week, not carry forward."
      ],
      dql: 'fetch dt.entity.cloud_resource\n| filter not(isNotNull(tags[project]))\n| fields entity.name, resource.type, creation_time'
    }
  },
  {
    id: "FT-03",
    towerId: "foundation",
    title: "Configuration Management Is Idempotent",
    maturity: "advanced",
    statement:
      "Ansible playbooks (configure-server.yml, deploy-backend.yml) are safe to re-run against an already-configured host. No shell step is added without a guard that makes it a no-op on a second run.",
    rationale:
      "A non-idempotent playbook step turns 'just re-run the job' — the normal recovery move — into a new source of breakage.",
    verification:
      "Running `ansible-playbook -i inventory.txt configure-server.yml` twice against the same host produces zero changes on the second run.",
    relatedRepoPaths: [
      ".circleci/ansible/configure-server.yml",
      ".circleci/ansible/deploy-backend.yml",
      ".circleci/ansible/roles"
    ],
    dynatrace: {
      monitorType: "OneAgent coverage + host anomaly detection",
      steps: [
        "Add OneAgent installation to the same Ansible role that provisions each EC2 instance, so instrumentation is as standard as the app deploy itself.",
        "In the Hosts app, filter by the `project:udapeople` management zone and confirm 100% of hosts report a OneAgent.",
        "Enable a Davis alert for 'host exists without a reporting OneAgent for more than 15 minutes' so a provisioning regression surfaces immediately."
      ]
    }
  },
  {
    id: "FT-04",
    towerId: "foundation",
    title: "Drift Is Detected, Not Discovered During an Incident",
    maturity: "advanced",
    statement:
      "Deployed infrastructure state is periodically compared against the CloudFormation template it was created from. Drift is a finding to act on, not something first noticed while debugging an outage.",
    rationale:
      "Every hand fix under incident pressure is a future drift finding; catching it on a schedule is cheaper than catching it in a postmortem.",
    verification:
      "A scheduled check reports each stack's drift status (`aws cloudformation detect-stack-drift`) and the result is visible somewhere other than an engineer's terminal history.",
    relatedRepoPaths: [".circleci/files/backend.yml", ".circleci/files/frontend.yml"],
    dynatrace: {
      monitorType: "Scheduled Workflow + Custom Event for Alerting",
      steps: [
        "Add a Workflow step (JavaScript function) that calls `detect-stack-drift` for the active stacks on a daily schedule.",
        "Feed the result into Dynatrace as a Custom Event for Alerting when any stack reports `DRIFTED`.",
        "Link the alert to the FT-01 management zone so responders land on the right Smartscape view immediately."
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Radar Tower — observability & reliability standards
  // ---------------------------------------------------------------------
  {
    id: "RT-01",
    towerId: "radar",
    title: "Golden Signals, Not Just a Curl Check",
    maturity: "foundational",
    statement:
      "Every deployable service has continuous coverage of availability, latency, error rate and saturation — the CI smoke test is a floor, not the whole story.",
    rationale:
      "A curl that runs once at deploy time tells you the service was healthy for one second; users experience every second in between.",
    verification:
      "A Synthetic HTTP monitor exists for /api/status and for the frontend homepage, running on a fixed interval independent of deploys.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Synthetic HTTP monitor",
      steps: [
        "Open the Synthetic Monitors app and choose 'Create a monitor' > HTTP monitor.",
        "Enter the backend URL (`http://<backend-ip>:3030/api/status`) and add a content-match assertion for the string `ok` — the same assertion the CI smoke test uses.",
        "Repeat for the frontend S3/CloudFront URL, asserting on the `Welcome` marker text.",
        "Set a check frequency (5 minutes is a reasonable start) and at least two locations, then save."
      ]
    }
  },
  {
    id: "RT-02",
    towerId: "radar",
    title: "Define the SLO Before Configuring the Alert",
    maturity: "advanced",
    statement:
      "A Service Level Objective is defined for each service's critical path (for example: 99% of /api/* requests complete under 500ms, 99.5% succeed) before any paging alert is wired up for it.",
    rationale:
      "An alert without an SLO behind it pages on noise; an SLO without an alert never gets enforced. The SLO has to come first so the alert threshold means something.",
    verification:
      "An SLO or Site Reliability Guardian object exists for udapeople-backend with a documented target, and alert thresholds are derived from its burn rate rather than picked arbitrarily.",
    relatedRepoPaths: [],
    dynatrace: {
      monitorType: "Site Reliability Guardian / SLO",
      steps: [
        "In Dynatrace, create an SLO or Guardian for the backend service using a DQL-based metric on request duration and success rate.",
        "Set the target (e.g. 99% success, p95 latency under 500ms) and the evaluation window.",
        "Wire the Guardian's pass/fail result into the deploy Workflow as described in LT-02, so a bad release is blocked by the SLO, not just observed by it."
      ],
      dql: 'fetch dt.service.request\n| filter dt.entity.service == "SERVICE-udapeople-backend"\n| summarize failureRate = avg(failed), p95 = percentile(duration, 95)'
    }
  },
  {
    id: "RT-03",
    towerId: "radar",
    title: "Prefer Adaptive Baselines Over Hardcoded Thresholds",
    maturity: "foundational",
    statement:
      "Response time and failure-rate alerting relies on Davis AI adaptive baselining wherever possible. Static thresholds are reserved for hard operational limits, such as disk usage, that don't have a meaningful 'normal'.",
    rationale:
      "A fixed threshold is either too tight (constant false pages) or too loose (misses real regressions) as traffic patterns change; adaptive baselining tracks the actual shape of normal.",
    verification:
      "Anomaly detection for udapeople-backend is set to Davis AI mode for response time and failure rate; only infra-level thresholds (disk, memory) use static values.",
    relatedRepoPaths: [],
    dynatrace: {
      monitorType: "Davis AI anomaly detection",
      steps: [
        "Go to Settings > Anomaly Detection > Services and confirm response-time and failure-rate detection is on Davis AI mode (not a fixed threshold) for udapeople-backend.",
        "For host-level disk usage, add a static Custom Event for Alerting at 90% used — a hard limit that doesn't benefit from statistical baselining.",
        "Review Davis problems monthly to confirm the baseline is still tracking real traffic, not a stale pattern from a previous release."
      ]
    }
  },
  {
    id: "RT-04",
    towerId: "radar",
    title: "Logs Are Structured, Shipped, and Queryable",
    maturity: "advanced",
    statement:
      "Backend logs are JSON-structured and shipped to a central store. Nobody's incident response depends on SSH-ing into an EC2 instance to read a local log file.",
    rationale:
      "A log that only exists on the instance that produced it disappears the moment that instance is torn down in the next blue-green cutover.",
    verification:
      "Backend logging uses a structured logger (winston) with a JSON format, and log volume by level is queryable in Dynatrace, not just `tail -f` over SSH.",
    relatedRepoPaths: ["backend/package.json"],
    dynatrace: {
      monitorType: "Log ingest + Notebook",
      steps: [
        "Confirm OneAgent log ingestion is picking up the backend's log path (configured via the same Ansible role from FT-03), or wire the Generic Log Ingest API if the app ships logs directly.",
        "Build a Notebook with a DQL query grouping log volume by `loglevel` over time.",
        "Correlate error-log spikes with the deploy events from LT-04 in the same view, so 'did this deploy cause more errors' is a five-second look, not an investigation."
      ],
      dql: 'fetch logs\n| filter dt.entity.service == "SERVICE-udapeople-backend"\n| summarize count(), by:{loglevel, bin(timestamp, 5m)}'
    }
  },
  {
    id: "RT-05",
    towerId: "radar",
    title: "One Dashboard Answers 'Is Prod Healthy Right Now'",
    maturity: "foundational",
    statement:
      "Each environment has a single dashboard combining synthetic status, SLO burn rate, and deploy markers. Answering 'is prod healthy' should never require opening four different tools.",
    rationale:
      "Observability tooling that exists but isn't consolidated gets checked less and less often — the value is in the single glance, not the underlying data.",
    verification:
      "A dashboard scoped to the `project:udapeople` management zone exists, is pinned, and is linked from this Standards Hub.",
    relatedRepoPaths: [],
    dynatrace: {
      monitorType: "Dashboard",
      steps: [
        "In the Dashboards app, create a new dashboard scoped to the `project:udapeople` management zone.",
        "Add tiles for: the RT-01 synthetic monitors, the RT-02 SLO/Guardian status, and a DQL tile listing recent deploy events from LT-04.",
        "Pin the dashboard and add its link back into this app (see the Checklist page) so the control tower metaphor is literally true — one place, everything visible."
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Vault Tower — security & compliance standards
  // ---------------------------------------------------------------------
  {
    id: "VT-01",
    towerId: "vault",
    title: "No Real Secrets in Version Control or Public KV Stores",
    maturity: "foundational",
    statement:
      "Runtime secrets (DB credentials, JWT signing key) live only in CircleCI project environment variables or a proper secret store — never hardcoded, and never written to an unauthenticated public key-value store. A public KV store may hold disposable, non-sensitive coordination flags only, such as a boolean migration-success marker, and nothing that resembles a credential.",
    rationale:
      "kvdb.io buckets used for pipeline coordination in this repo are unauthenticated by default; that's an acceptable risk for a throwaway boolean flag and an unacceptable one for anything a credential could be mistaken for.",
    verification:
      "grep the repo and pipeline config for anything written to kvdb.io and confirm every value is a disposable flag, never a secret; confirm backend/.env.sample contains no real values.",
    relatedRepoPaths: [".circleci/config.yml", "backend/.env.sample"],
    dynatrace: {
      monitorType: "Audit log review",
      steps: [
        "If this coordination pattern is ever moved into Dynatrace, keep the state in a Workflow's own execution context or an Apps document instead of an external public store.",
        "Review the Dynatrace Audit Log periodically for any API token or credential-shaped value appearing in a Workflow input, and rotate it immediately if found."
      ]
    }
  },
  {
    id: "VT-02",
    towerId: "vault",
    title: "CI Access Is Least-Privilege and Rotated",
    maturity: "advanced",
    statement:
      "The SSH key and AWS credentials CircleCI uses are scoped to exactly what deploy requires, and are rotated on a defined schedule — not a shared long-lived admin key that outlives the person who created it.",
    rationale:
      "A pipeline credential is a standing target: it runs unattended, on every commit, and is often the widest-reaching key in the whole system if nobody scopes it down.",
    verification:
      "The IAM user/role behind the CI AWS credentials has a policy limited to the actions deploy-infrastructure and deploy-backend actually call; the SSH key fingerprint is tracked with a known owner and rotation date.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Scheduled Workflow + DQL over token/system events",
      steps: [
        "Build a Workflow, scheduled monthly, that queries Dynatrace API token and OneAgent install-token age via DQL.",
        "Flag any token older than 90 days for rotation and notify the owning team.",
        "Use the same review to sanity-check the CI-side AWS/SSH credentials against IAM's own last-rotated metadata, even though that check itself runs outside Dynatrace."
      ],
      dql: 'fetch dt.system.events\n| filter event.category == "API_TOKEN"\n| fields token.name, token.created, token.lastUsed'
    }
  },
  {
    id: "VT-03",
    towerId: "vault",
    title: "Plain-HTTP Endpoints Are a Tracked, Expiring Exception",
    maturity: "advanced",
    statement:
      "Service traffic is expected to run over TLS. Where a service is reachable over plain HTTP as a known interim state — as the backend's smoke-test endpoint currently is — that gap is tracked with an owner and an expiry, not treated as a permanent acceptable state.",
    rationale:
      "'Temporary' plain-HTTP endpoints that nobody tracks become permanent by default; the fix is to make the exception visible, not to pretend it doesn't exist.",
    verification:
      "The plain-HTTP backend endpoint has a linked tracking item with an owner and target date; that item is reviewed, not closed silently by simply not mentioning it again.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Custom Event for Alerting on synthetic monitor config",
      steps: [
        "Tag the RT-01 backend synthetic monitor with a `tls-exception` tag while it targets a `http://` URL.",
        "Create a Custom Event for Alerting that fires if a monitor carrying that tag is still active after its tracked expiry date, turning a silent gap into a scheduled nag.",
        "Remove the tag the same day the endpoint moves to HTTPS — the tag's presence is the whole point, so let it disappear as the signal that the debt is paid off."
      ]
    }
  },
  {
    id: "VT-04",
    towerId: "vault",
    title: "Least-Privilege Runtime Access to Data",
    maturity: "advanced",
    statement:
      "The backend's database role has exactly the permissions the application needs (read/write on its own schema) — not an admin or superuser role reused from setup.",
    rationale:
      "A compromised application process with superuser database access turns an app-level bug into a full data breach.",
    verification:
      "The TypeORM connection user in production is a dedicated, scoped role, distinct from the role used to run migrations or administer the database.",
    relatedRepoPaths: ["backend/src/modules"],
    dynatrace: {
      monitorType: "Davis anomaly detection on database service",
      steps: [
        "Ensure the database is discovered as a service in Dynatrace (via OneAgent or the relevant extension) so its query patterns are visible.",
        "Enable Davis AI anomaly detection for unusual query volume or new query patterns against the database service, which is the practical early-warning signal for a credential being used outside its normal scope."
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Recovery Tower — release, rollback & data standards
  // ---------------------------------------------------------------------
  {
    id: "RC-01",
    towerId: "recovery",
    title: "Blue-Green Cutover With a Real Rollback Path",
    maturity: "foundational",
    statement:
      "New infrastructure is created alongside the old one, tagged with the new Workflow ID. CloudFront only cuts traffic over after smoke tests pass, and the previous stack is only removed after that cutover succeeds.",
    rationale:
      "If cutover and teardown happen in the same step, there is no window to roll back — the old, known-good environment is already gone by the time anyone notices a problem.",
    verification:
      "cloudfront-update runs only after smoke-test passes; cleanup runs only after cloudfront-update, and always targets the previous Workflow ID, never the current one.",
    relatedRepoPaths: [".circleci/config.yml", ".circleci/files/cloudfront.yml"],
    dynatrace: {
      monitorType: "Synthetic monitor tagging + shadow comparison",
      steps: [
        "Add a Workflow step right after cloudfront-update that retags the RT-01 synthetic monitor and SLO with the newly active Workflow ID.",
        "Keep the previous Workflow ID's synthetic monitor running for one extra deploy cycle in 'shadow' mode so there's a live comparison baseline before cleanup deletes that stack.",
        "Only let cleanup proceed once the shadow monitor shows no regression relative to the new one."
      ]
    }
  },
  {
    id: "RC-02",
    towerId: "recovery",
    title: "Every Migration Ships With a Tested Revert",
    maturity: "foundational",
    statement:
      "Every schema migration has a working `migration:revert`, exercised at least once before merge. revert-migrations is wired to run automatically whenever a downstream deploy job fails.",
    rationale:
      "A migration without a tested revert turns 'roll back the release' into 'manually fix the database while production is down'.",
    verification:
      "run-migrations writes its result to the kvdb.io flag consumed by revert-migrations; a reviewer has actually run `npm run migrations:revert` against the new migration during code review.",
    relatedRepoPaths: [".circleci/config.yml", "backend/package.json", "backend/src/migrations"],
    dynatrace: {
      monitorType: "Events API v2 + Notebook trend",
      steps: [
        "Emit a Dynatrace event at migration start and another at outcome (success or reverted), tagged with the migration name and Workflow ID — reusing the LT-04 event stream.",
        "Build a Notebook tile trending 'migrations run vs. migrations reverted' over time.",
        "Treat a rising revert rate as a process signal: migrations aren't being tested thoroughly enough pre-merge, independent of any single incident."
      ]
    }
  },
  {
    id: "RC-03",
    towerId: "recovery",
    title: "Any Failed Gate Triggers Automatic Rollback",
    maturity: "foundational",
    statement:
      "destroy-environment and revert-migrations run `when: on_fail` on every job from infrastructure deploy through the CloudFront update, so a failure anywhere in the pipeline leaves no half-provisioned environment behind.",
    rationale:
      "A half-deployed environment left behind on failure is both a cost leak and a trap for the next engineer who assumes 'it's in CircleCI, it must be clean'.",
    verification:
      "Every job between deploy-infrastructure and cloudfront-update lists destroy-environment (and revert-migrations, where migrations have already run) as an on-fail step.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Guardian-triggered Workflow action",
      steps: [
        "Extend the RT-02 Guardian validation step so a failed post-deploy SLO check triggers a Workflow action that calls back into the CircleCI API to fail the pipeline.",
        "This closes the loop between 'Dynatrace saw a regression after cutover' and 'the pipeline reacts' — not just the CI's own smoke test catching problems before cutover."
      ]
    }
  },
  {
    id: "RC-04",
    towerId: "recovery",
    title: "Smoke Tests Match What Real Users Hit",
    maturity: "advanced",
    statement:
      "Smoke tests assert against the same endpoints and content that real users depend on (/api/status, the homepage marker text), and are updated whenever that health surface changes.",
    rationale:
      "A smoke test that drifts from reality — asserting on an endpoint nobody uses anymore — gives false confidence that a deploy is safe.",
    verification:
      "smoke-test's assertions match RT-01's synthetic monitor assertions exactly; a change to one triggers a review of the other.",
    relatedRepoPaths: [".circleci/config.yml"],
    dynatrace: {
      monitorType: "Synthetic HTTP monitor (shared assertions with CI)",
      steps: [
        "Whenever smoke-test's content-match string changes, update the RT-01 synthetic monitor's assertion in the same pull request.",
        "Treat 'what does healthy mean' as defined exactly once and referenced twice — CI's one-shot check and Dynatrace's continuous check — never redefined independently in each place."
      ]
    }
  }
];

export const standardsByTower = (towerId: string): Standard[] =>
  standards.filter((s) => s.towerId === towerId);

export const standardById = (id: string): Standard | undefined =>
  standards.find((s) => s.id === id);

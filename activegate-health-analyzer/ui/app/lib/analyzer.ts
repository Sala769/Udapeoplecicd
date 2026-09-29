import kbJson from "./knownIssuesKb.json";
import sizing from "./sizingConfig.json";
import type {
  Analysis,
  Finding,
  KbMatch,
  KbRule,
  ParsedArchive,
  SizingConfig,
  Unclassified,
} from "./types";

export const kbRules = kbJson as KbRule[];
export const sizingConfig: SizingConfig = sizing;

const normalize = (text: string): string =>
  text
    .split("\n", 1)[0]
    .replace(TS_PREFIX, "")
    .replace(/\b[0-9a-f]{8,}\b/gi, "#")
    .replace(/\d+/g, "#")
    .slice(0, 160);
const TS_PREFIX = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\s*(?:UTC|Z)?\s*/;

const compile = (rules: KbRule[]): { rule: KbRule; re: RegExp }[] =>
  rules.flatMap((rule) => {
    try {
      return [{ rule, re: new RegExp(rule.pattern, "i") }];
    } catch {
      return []; // an invalid pattern in the editable KB must not break analysis
    }
  });

export const matchKb = (
  archive: ParsedArchive,
  rules: KbRule[],
): { matches: KbMatch[]; unclassified: Unclassified[] } => {
  const compiled = compile(rules);
  const byRule = new Map<string, KbMatch>();
  const uncl = new Map<string, Unclassified>();

  for (const entry of archive.logs) {
    const hit = compiled.find(({ re }) => re.test(entry.text));
    if (hit) {
      const m = byRule.get(hit.rule.id) ?? {
        rule: hit.rule,
        count: 0,
        first: entry.ts,
        last: entry.ts,
        sample: entry.text,
        files: [],
      };
      m.count++;
      if (entry.ts !== undefined) {
        m.first = m.first === undefined ? entry.ts : Math.min(m.first, entry.ts);
        m.last = m.last === undefined ? entry.ts : Math.max(m.last, entry.ts);
      }
      if (!m.files.includes(entry.file)) m.files.push(entry.file);
      byRule.set(hit.rule.id, m);
    } else if (entry.level === "ERROR" || entry.level === "WARNING") {
      const key = `${entry.level}|${normalize(entry.text)}`;
      const u = uncl.get(key) ?? {
        key,
        level: entry.level,
        count: 0,
        first: entry.ts,
        last: entry.ts,
        sample: entry.text.split("\n", 1)[0],
        context: entry.text,
      };
      u.count++;
      if (entry.ts !== undefined) {
        u.first = u.first === undefined ? entry.ts : Math.min(u.first, entry.ts);
        u.last = u.last === undefined ? entry.ts : Math.max(u.last, entry.ts);
      }
      uncl.set(key, u);
    }
  }
  return {
    matches: [...byRule.values()].sort((a, b) => b.count - a.count),
    unclassified: [...uncl.values()].sort((a, b) => b.count - a.count),
  };
};

export const buildFindings = (archive: ParsedArchive, matches: KbMatch[]): Finding[] => {
  const f: Finding[] = [];
  const { jvm, system } = archive;
  const cfg = sizingConfig;

  for (const m of matches) {
    f.push({
      id: `kb-${m.rule.id}`,
      severity: m.rule.severity,
      title: m.rule.title,
      detail: `${m.count} occurrence(s) in the archive. Root cause: ${m.rule.rootCause}`,
      action: m.rule.resolution + (m.rule.rfaNeeded ? " If not resolved, raise an RFA with the ActiveGate RFA checklist." : ""),
      links: m.rule.links,
    });
  }

  if (jvm.trustStoreOverride && matches.some((m) => m.rule.id === "truststore-override")) {
    f.push({
      id: "trust-override-present",
      severity: "critical",
      title: "javax.net.ssl.trustStore override detected",
      detail: `The JVM arguments set javax.net.ssl.trustStore=${jvm.trustStoreOverride}, which silently bypasses the Dynatrace custom truststore.`,
      action: "Remove the override, restart, and confirm the log shows the custom certificate configuration applied.",
    });
  }

  if (jvm.xmsMb && jvm.xmxMb && jvm.xmxMb / jvm.xmsMb >= cfg.xmsToXmxGapRatio) {
    f.push({
      id: "xms-xmx-gap",
      severity: "info",
      title: `Large -Xms/-Xmx gap (${jvm.xmsMb} MB to ${jvm.xmxMb} MB)`,
      detail:
        "With a low -Xms G1GC may expand into new regions instead of compacting, so sustained high Old Gen % is not automatically a leak. See the Utilization page for the live Old Gen trend.",
      action: "Correlate onset with ActiveGate version or extension changes before raising -Xms.",
    });
  }
  if (jvm.xmxMb && jvm.xmxMb < cfg.minHeapMb) {
    f.push({
      id: "heap-below-min",
      severity: "warning",
      title: `Max heap ${jvm.xmxMb} MB is below the configured minimum (${cfg.minHeapMb} MB)`,
      detail: "Sizing thresholds are configuration in sizingConfig.json; verify them against the current docs.",
      action: "Review ActiveGate sizing documentation for this workload.",
      links: cfg.docs,
    });
  }
  if (system.cpuCores && system.cpuCores < cfg.minCpuCores) {
    f.push({
      id: "cpu-below-min",
      severity: "warning",
      title: `Host has ${system.cpuCores} CPU core(s), below the configured minimum (${cfg.minCpuCores})`,
      detail: "Undersized hosts show high self-monitoring CPU % that reflects capacity, not misbehavior.",
      action: "Review ActiveGate sizing documentation and scale the host.",
      links: cfg.docs,
    });
  }
  if (system.memTotalMb && system.memTotalMb < cfg.minMemoryGb * 1024) {
    f.push({
      id: "mem-below-min",
      severity: "warning",
      title: `Host RAM ${Math.round(system.memTotalMb / 1024)} GB is below the configured minimum (${cfg.minMemoryGb} GB)`,
      detail: "Low host memory limits headroom for the JVM heap.",
      action: "Review ActiveGate sizing documentation.",
      links: cfg.docs,
    });
  }

  if (archive.tenantPhase === "3") {
    const dep = archive.loadedModules.filter((mod) =>
      cfg.deprecatedModules.some((d) => mod.toLowerCase().includes(d)),
    );
    if (dep.length) {
      f.push({
        id: "deprecated-modules",
        severity: "warning",
        title: `Deprecated modules on a Phase 3 tenant: ${dep.join(", ")}`,
        detail: "These modules will not load on Phase 3 tenants.",
        action: "Migrate to the supported replacements before the Phase 3 rollout.",
      });
    }
  }

  if (archive.oomEvents.length) {
    f.push({
      id: "oom-correlate",
      severity: "critical",
      title: `${archive.oomEvents.length} OutOfMemoryError event(s) in the archive`,
      detail: `Timestamps: ${archive.oomEvents.slice(0, 5).map((t) => new Date(t).toISOString()).join(", ")}. Check whether heap and CPU spiked at the same time (utilization-caused) or grew steadily (leak or extension).`,
      action: "Capture a heap dump and audit recent extension changes.",
    });
  }

  f.push({
    id: "autoupdate-note",
    severity: "info",
    title: "Version and autoupdate expectations",
    detail:
      "A cluster upgrade makes new ActiveGate installers available independent of the ActiveGate's own autoupdate window. EEC/module autoupdate (Synthetic, zRemote, Remote Plugins) is not gated by that window at all.",
    action: "Check whether the ActiveGate binary or only the EEC/module layer updated.",
    links: cfg.docs,
  });

  const order = { critical: 0, warning: 1, info: 2 };
  return f.sort((a, b) => order[a.severity] - order[b.severity]);
};

export const analyze = (archive: ParsedArchive, rules: KbRule[] = kbRules): Analysis => {
  const { matches, unclassified } = matchKb(archive, rules);
  const findings = buildFindings(archive, matches);
  const penalty = findings.reduce((s, x) => s + (x.severity === "critical" ? 20 : x.severity === "warning" ? 8 : 0), 0);
  return { archive, matches, unclassified, findings, healthScore: Math.max(0, 100 - penalty) };
};

/**
 * Heap-shape classification over a series of Old Gen % samples.
 * Separates steady-high usage from erratic zig-zag behaviour.
 */
export const classifyHeapPattern = (
  samples: number[],
  cfg: Pick<SizingConfig, "heapHighPct" | "heapSustainedPct">,
): { pattern: "steady-high" | "zigzag" | "normal" | "insufficient-data"; detail: string } => {
  if (samples.length < 12) return { pattern: "insufficient-data", detail: "Too few samples." };
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  let flips = 0;
  let bigSwings = 0;
  for (let i = 2; i < samples.length; i++) {
    const d1 = samples[i - 1] - samples[i - 2];
    const d2 = samples[i] - samples[i - 1];
    if (d1 * d2 < 0) {
      flips++;
      if (Math.abs(d1) > 10 && Math.abs(d2) > 10) bigSwings++;
    }
  }
  const flipRate = flips / (samples.length - 2);
  if (bigSwings >= 3 && flipRate > 0.4) {
    return { pattern: "zigzag", detail: `${bigSwings} large alternating swings; distinct from steady-high usage. Compare against version or extension changes and module reload loops.` };
  }
  if (avg >= cfg.heapSustainedPct) return { pattern: "steady-high", detail: `Average ${avg.toFixed(0)}% over the window.` };
  return { pattern: "normal", detail: `Average ${avg.toFixed(0)}%.` };
};

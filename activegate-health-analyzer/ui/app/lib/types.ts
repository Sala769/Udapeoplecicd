export type Severity = "critical" | "warning" | "info";

export interface KbRule {
  id: string;
  title: string;
  /** JavaScript regular expression source, matched case-insensitively against a log line. */
  pattern: string;
  severity: Severity;
  rootCause: string;
  resolution: string;
  rfaNeeded: boolean;
  links?: { label: string; url: string }[];
}

export interface LogEntry {
  /** ms since epoch, or undefined if the line had no parsable timestamp */
  ts?: number;
  level: string;
  file: string;
  text: string;
}

export interface JvmSettings {
  xmsMb?: number;
  xmxMb?: number;
  rawArgs: string[];
  /** true when an explicit javax.net.ssl.trustStore override is present */
  trustStoreOverride?: string;
}

export interface SystemInfo {
  cpuCores?: number;
  memTotalMb?: number;
  cpuModel?: string;
  osRelease?: string;
}

export interface ThreadDump {
  file: string;
  ts?: number;
  threadCount: number;
}

export interface ParsedArchive {
  fileName: string;
  files: string[];
  hostname?: string;
  version?: string;
  tenantPhase?: string;
  logs: LogEntry[];
  properties: Record<string, Record<string, string>>;
  jvm: JvmSettings;
  system: SystemInfo;
  threadDumps: ThreadDump[];
  oomEvents: number[];
  loadedModules: string[];
  window: { from: number; to: number };
}

export interface KbMatch {
  rule: KbRule;
  count: number;
  first: number | undefined;
  last: number | undefined;
  sample: string;
  files: string[];
}

export interface Unclassified {
  key: string;
  level: string;
  count: number;
  first: number | undefined;
  last: number | undefined;
  sample: string;
  context: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  action: string;
  links?: { label: string; url: string }[];
}

export interface Analysis {
  archive: ParsedArchive;
  matches: KbMatch[];
  unclassified: Unclassified[];
  findings: Finding[];
  healthScore: number;
}

export interface SizingConfig {
  source: string;
  note: string;
  /** Recommended minimum heap for the ActiveGate JVM, in MB, per role */
  minHeapMb: number;
  minCpuCores: number;
  minMemoryGb: number;
  heapHighPct: number;
  heapSustainedPct: number;
  cpuHighPct: number;
  xmsToXmxGapRatio: number;
  deprecatedModules: string[];
  docs: { label: string; url: string }[];
}

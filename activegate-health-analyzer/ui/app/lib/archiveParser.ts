import JSZip from "jszip";
import type {
  JvmSettings,
  LogEntry,
  ParsedArchive,
  SystemInfo,
  ThreadDump,
} from "./types";

const TS_RE =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:[.,](\d{1,3})\d*)?\s*(UTC|Z)?/;
const LEVEL_RE = /\b(SEVERE|ERROR|WARNING|WARN|INFO|FINE|FINER|DEBUG|TRACE)\b/i;
const TEXT_FILE_RE =
  /\.(log|properties|conf|txt|out|json|yaml|yml|ini|xml|dump|info)(\.\d+)?$|gateway\.log|sysinfo|system/i;
const MAX_TEXT_BYTES = 60 * 1024 * 1024;

const parseTs = (line: string): number | undefined => {
  const m = TS_RE.exec(line);
  if (!m) return undefined;
  const ms = (m[3] ?? "0").padEnd(3, "0");
  const t = Date.parse(`${m[1]}T${m[2]}.${ms}Z`);
  return Number.isNaN(t) ? undefined : t;
};

const normLevel = (raw: string): string => {
  const l = raw.toUpperCase();
  if (l === "WARN") return "WARNING";
  if (l === "SEVERE") return "ERROR";
  return l;
};

export const parseLogText = (file: string, text: string): LogEntry[] => {
  const out: LogEntry[] = [];
  let current: LogEntry | undefined;
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const ts = parseTs(line);
    if (ts !== undefined) {
      const lm = LEVEL_RE.exec(line.slice(0, 200));
      current = { ts, level: lm ? normLevel(lm[1]) : "INFO", file, text: line };
      out.push(current);
    } else if (current && current.text.length < 8000) {
      // stack trace / continuation line
      current.text += "\n" + line;
    } else {
      current = { level: LEVEL_RE.exec(line)?.[1]?.toUpperCase() ?? "INFO", file, text: line };
      out.push(current);
    }
  }
  return out;
};

export const parseProperties = (text: string): Record<string, string> => {
  const props: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const idx = line.search(/[=:]/);
    if (idx > 0) props[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return props;
};

const toMb = (n: string, unit: string): number => {
  const v = Number(n);
  switch (unit.toLowerCase()) {
    case "g":
      return v * 1024;
    case "k":
      return v / 1024;
    default:
      return v;
  }
};

export const parseJvm = (texts: string[]): JvmSettings => {
  const jvm: JvmSettings = { rawArgs: [] };
  for (const t of texts) {
    for (const m of t.matchAll(/-Xm([sx])(\d+)([kKmMgG])/g)) {
      const mb = toMb(m[2], m[3]);
      if (m[1] === "s") jvm.xmsMb = Math.max(jvm.xmsMb ?? 0, mb);
      else jvm.xmxMb = Math.max(jvm.xmxMb ?? 0, mb);
      jvm.rawArgs.push(m[0]);
    }
    const ts = /-Djavax\.net\.ssl\.trustStore=(\S+)/.exec(t);
    if (ts) jvm.trustStoreOverride = ts[1];
  }
  return jvm;
};

export const parseSystem = (texts: string[]): SystemInfo => {
  const sys: SystemInfo = {};
  for (const t of texts) {
    const mem = /MemTotal:\s+(\d+)\s*kB/i.exec(t);
    if (mem && !sys.memTotalMb) sys.memTotalMb = Math.round(Number(mem[1]) / 1024);
    const cores = t.match(/^processor\s*:/gim);
    if (cores && !sys.cpuCores) sys.cpuCores = cores.length;
    const nproc = /(?:CPU\(s\)|cpu cores|NumberOfLogicalProcessors)\s*[:=]\s*(\d+)/i.exec(t);
    if (nproc && !sys.cpuCores) sys.cpuCores = Number(nproc[1]);
    const model = /model name\s*:\s*(.+)/i.exec(t);
    if (model && !sys.cpuModel) sys.cpuModel = model[1].trim();
    const os = /PRETTY_NAME="?([^"\n]+)"?/.exec(t);
    if (os && !sys.osRelease) sys.osRelease = os[1];
  }
  return sys;
};

export const parseArchive = async (file: File): Promise<ParsedArchive> => {
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const logs: LogEntry[] = [];
  const properties: Record<string, Record<string, string>> = {};
  const configTexts: string[] = [];
  const sysTexts: string[] = [];
  const threadDumps: ThreadDump[] = [];
  let budget = MAX_TEXT_BYTES;

  for (const name of names) {
    const base = name.split("/").pop() ?? name;
    if (!TEXT_FILE_RE.test(base) && !/thread|dump/i.test(base)) continue;
    if (budget <= 0) break;
    const text = await zip.files[name].async("string");
    budget -= text.length;

    if (/thread.?dump|threaddump/i.test(name) || /^"[^"]+" .*(prio|tid)=/m.test(text.slice(0, 20000))) {
      threadDumps.push({
        file: name,
        ts: parseTs(text.split(/\r?\n/, 1)[0] ?? ""),
        threadCount: (text.match(/^"[^"]+"/gm) ?? []).length,
      });
    }
    if (/\.properties$/i.test(base)) {
      properties[base] = parseProperties(text);
      configTexts.push(text);
    } else if (/\.(conf|ini)$/i.test(base) || /wrapper|jvm|options/i.test(base)) {
      configTexts.push(text);
    }
    if (/sysinfo|system|cpuinfo|meminfo|os-release|lscpu/i.test(name)) sysTexts.push(text);
    if (/\.log(\.\d+)?$|\.out$/i.test(base)) logs.push(...parseLogText(name, text));
  }

  const joinedHead = logs
    .slice(0, 4000)
    .map((l) => l.text)
    .join("\n");
  const hostname =
    /(?:hostname|host name|host)\s*[=:]\s*([\w.-]+)/i.exec(sysTexts.join("\n") + "\n" + joinedHead)?.[1] ??
    /^([\w.-]+?)[-_]activegate/i.exec(file.name)?.[1];
  const version = /(?:ActiveGate|Gateway)[^\n]{0,60}?version[^\d]{0,5}(\d+\.\d+\.\d+(?:\.\d+)?)/i.exec(
    joinedHead,
  )?.[1];
  const tenantPhase = /Tenant phase:\s*(\d)/i.exec(logs.map((l) => l.text).join("\n"))?.[1];
  const loadedModules = Array.from(
    new Set(
      logs
        .map((l) => /(?:Loading|Loaded|Starting) (?:module|extension)[: ]+([\w .-]+)/i.exec(l.text)?.[1]?.trim())
        .filter((m): m is string => Boolean(m)),
    ),
  );

  const stamps = logs.map((l) => l.ts).filter((t): t is number => t !== undefined);
  const to = stamps.length ? Math.max(...stamps) : Date.now();
  const from = stamps.length ? Math.max(Math.min(...stamps), to - 7 * 864e5) : to - 7 * 864e5;

  const oomEvents = logs
    .filter((l) => l.ts !== undefined && /OutOfMemoryError/.test(l.text))
    .map((l) => l.ts as number);

  return {
    fileName: file.name,
    files: names,
    hostname,
    version,
    tenantPhase,
    logs: logs.filter((l) => l.ts === undefined || l.ts >= from),
    properties,
    jvm: parseJvm(configTexts.concat(sysTexts)),
    system: parseSystem(sysTexts),
    threadDumps,
    oomEvents,
    loadedModules,
    window: { from, to },
  };
};

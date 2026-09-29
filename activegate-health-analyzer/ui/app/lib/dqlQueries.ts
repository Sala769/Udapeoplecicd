/**
 * DQL builders. Metric keys and the entity dimension name live here so they can be
 * confirmed against the tenant's Metric Browser: the dsfm:active_gate.* namespace evolves.
 */
export const AG_DIM = "dt.entity.active_gate";

export const METRICS = {
  cpu: "dsfm:active_gate.jvm.cpu_usage",
  oldGen: "dsfm:active_gate.jvm.memory.pool.old_gen.usage",
  gcDuration: "dsfm:active_gate.jvm.gc.duration",
  trafficSent: "dsfm:active_gate.traffic.client.sent",
  trafficReceived: "dsfm:active_gate.traffic.client.received",
  dropped: "dsfm:active_gate.communication.messages.dropped",
} as const;

export interface Window {
  from: number;
  to: number;
}

const tf = (w: Window): string =>
  `from:"${new Date(w.from).toISOString()}", to:"${new Date(w.to).toISOString()}"`;

const esc = (s: string): string => s.replace(/[\\"]/g, "");

export const resolveAgQuery = (hostname: string): string =>
  `fetch dt.entity.active_gate\n| filter contains(entity.name, "${esc(hostname)}")\n| fields id, entity.name\n| limit 20`;

export const agSeries = (fn: string, metric: string, agId: string, w: Window, extra = ""): string =>
  `timeseries ${fn}(${metric})${extra}, by:{${AG_DIM}}, ${tf(w)}\n| filter ${AG_DIM} == "${esc(agId)}"`;

export const seriesQueries = (agId: string, w: Window): Record<string, { title: string; query: string }> => ({
  cpu: { title: "JVM CPU usage", query: agSeries("avg", METRICS.cpu, agId, w) },
  oldGen: { title: "Old Gen pool usage", query: agSeries("avg", METRICS.oldGen, agId, w) },
  gc: { title: "GC duration", query: agSeries("sum", METRICS.gcDuration, agId, w) },
  sent: { title: "Traffic sent", query: agSeries("sum", METRICS.trafficSent, agId, w) },
  received: { title: "Traffic received", query: agSeries("sum", METRICS.trafficReceived, agId, w) },
  dropped: { title: "Dropped messages", query: agSeries("sum", METRICS.dropped, agId, w) },
});

export const logQuery = (agId: string, w: Window): string =>
  `fetch logs, ${tf(w)}\n| filter ${AG_DIM} == "${esc(agId)}"\n| filter contains(content, "OutOfMemoryError") or contains(content, "CPU does not support")`;

export const followups = (agId: string, w: Window): { title: string; query: string }[] => [
  ...Object.values(seriesQueries(agId, w)),
  { title: "OOM and CPU-support errors in logs", query: logQuery(agId, w) },
];

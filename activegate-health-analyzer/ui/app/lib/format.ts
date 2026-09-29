export const fmtTs = (t?: number): string => (t === undefined ? "n/a" : new Date(t).toISOString().replace("T", " ").slice(0, 19) + "Z");

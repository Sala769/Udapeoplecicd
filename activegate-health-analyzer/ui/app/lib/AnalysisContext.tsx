import React, { createContext, useContext, useMemo, useState } from "react";
import type { Analysis } from "./types";

interface Ctx {
  analysis?: Analysis;
  setAnalysis: (a?: Analysis) => void;
  agId: string;
  setAgId: (id: string) => void;
}

const AnalysisCtx = createContext<Ctx>({
  setAnalysis: () => undefined,
  agId: "",
  setAgId: () => undefined,
});

export const AnalysisProvider = ({ children }: { children: React.ReactNode }) => {
  const [analysis, setAnalysis] = useState<Analysis | undefined>();
  const [agId, setAgId] = useState("");
  const value = useMemo(() => ({ analysis, setAnalysis, agId, setAgId }), [analysis, agId]);
  return <AnalysisCtx.Provider value={value}>{children}</AnalysisCtx.Provider>;
};

export const useAnalysis = (): Ctx => useContext(AnalysisCtx);

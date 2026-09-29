import React from "react";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { Paragraph } from "@dynatrace/strato-components/typography";
import { useAnalysis } from "../lib/AnalysisContext";
import type { Severity } from "../lib/types";

export const variantFor = (s: Severity): "critical" | "warning" | "primary" =>
  s === "critical" ? "critical" : s === "warning" ? "warning" : "primary";

export const NeedArchive = ({ children }: { children: (a: NonNullable<ReturnType<typeof useAnalysis>["analysis"]>) => React.ReactNode }) => {
  const { analysis } = useAnalysis();
  if (!analysis) {
    return (
      <MessageContainer variant="neutral">
        <MessageContainer.Title>No archive loaded</MessageContainer.Title>
        <MessageContainer.Description>
          <Paragraph>Upload an ActiveGate support archive on the Upload page first.</Paragraph>
        </MessageContainer.Description>
      </MessageContainer>
    );
  }
  return <>{children(analysis)}</>;
};

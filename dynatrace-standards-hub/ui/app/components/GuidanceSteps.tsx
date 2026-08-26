import React from "react";
import { DynatraceGuidance } from "../types";

export const GuidanceSteps = ({ guidance }: { guidance: DynatraceGuidance }) => (
  <div className="guidance">
    <div className="guidance-monitor-type">
      <span className="guidance-label">Dynatrace capability</span>
      <span className="guidance-monitor-value">{guidance.monitorType}</span>
    </div>
    <ol className="guidance-steps">
      {guidance.steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
    {guidance.dql && (
      <div className="guidance-dql">
        <span className="guidance-label">Example DQL</span>
        <pre>
          <code>{guidance.dql}</code>
        </pre>
      </div>
    )}
  </div>
);

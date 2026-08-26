import React from "react";
import { Maturity } from "../types";

const LABEL: Record<Maturity, string> = {
  foundational: "Foundational",
  advanced: "Advanced"
};

export const MaturityBadge = ({ maturity }: { maturity: Maturity }) => (
  <span className={`badge badge-${maturity}`}>{LABEL[maturity]}</span>
);

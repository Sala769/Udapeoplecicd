export type Maturity = "foundational" | "advanced";

export interface DynatraceGuidance {
  /** The Dynatrace capability that operationalizes this standard. */
  monitorType: string;
  /** Ordered, concrete steps an engineer follows inside Dynatrace. */
  steps: string[];
  /** Optional DQL snippet illustrating the query behind the guidance. */
  dql?: string;
}

export interface Standard {
  id: string;
  towerId: string;
  title: string;
  maturity: Maturity;
  /** The rule itself, phrased as a "shall" statement. */
  statement: string;
  /** Why this rule exists. */
  rationale: string;
  /** How an engineer or reviewer confirms compliance. */
  verification: string;
  /** Real files/jobs in this repo where the standard already applies. */
  relatedRepoPaths: string[];
  dynatrace: DynatraceGuidance;
}

export interface Tower {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
}

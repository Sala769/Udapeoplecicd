import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { towers } from "../data/towers";
import { standards, standardsByTower } from "../data/standards";
import { StandardCard } from "../components/StandardCard";

interface Props {
  adopted: Set<string>;
  onToggleAdopted: (id: string) => void;
}

function buildMarkdownSummary(adopted: Set<string>): string {
  const lines: string[] = ["# UdaPeople standards adoption", ""];
  for (const tower of towers) {
    const towerStandards = standardsByTower(tower.id);
    lines.push(`## ${tower.emoji} ${tower.name}`);
    for (const s of towerStandards) {
      lines.push(`- [${adopted.has(s.id) ? "x" : " "}] ${s.id} ${s.title}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const ChecklistPage = ({ adopted, onToggleAdopted }: Props) => {
  const [copied, setCopied] = useState(false);
  const total = standards.length;
  const adoptedCount = standards.filter((s) => adopted.has(s.id)).length;

  const handleCopy = async () => {
    const markdown = buildMarkdownSummary(adopted);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing to copy to, no-op.
    }
  };

  return (
    <Flex flexDirection="column" gap={16} padding={16}>
      <Flex flexDirection="column" gap={4}>
        <Heading level={1}>Adoption Checklist</Heading>
        <Paragraph>
          {adoptedCount} of {total} standards adopted. Checking a box here is the same state as checking it on the
          standard&rsquo;s own page or its tower list — it&rsquo;s one shared checklist, three views onto it.
        </Paragraph>
        <button type="button" className="chip" onClick={handleCopy} style={{ alignSelf: "flex-start" }}>
          {copied ? "Copied!" : "Copy summary as Markdown"}
        </button>
      </Flex>

      {towers.map((tower) => {
        const towerStandards = standardsByTower(tower.id);
        return (
          <Flex key={tower.id} flexDirection="column" gap={8}>
            <Heading level={3}>
              {tower.emoji} {tower.name}
            </Heading>
            <div className="standards-list">
              {towerStandards.map((s) => (
                <StandardCard key={s.id} standard={s} adopted={adopted.has(s.id)} onToggleAdopted={onToggleAdopted} />
              ))}
            </div>
          </Flex>
        );
      })}
    </Flex>
  );
};

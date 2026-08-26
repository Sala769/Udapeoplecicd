import React, { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { towerById } from "../data/towers";
import { standardsByTower } from "../data/standards";
import { StandardCard } from "../components/StandardCard";
import { Maturity } from "../types";

interface Props {
  adopted: Set<string>;
  onToggleAdopted: (id: string) => void;
}

export const TowerPage = ({ adopted, onToggleAdopted }: Props) => {
  const { towerId = "" } = useParams();
  const tower = towerById(towerId);
  const [query, setQuery] = useState("");
  const [maturityFilter, setMaturityFilter] = useState<Maturity | "all">("all");

  const standards = useMemo(() => standardsByTower(towerId), [towerId]);

  const filtered = standards.filter((s) => {
    const matchesMaturity = maturityFilter === "all" || s.maturity === maturityFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      s.title.toLowerCase().includes(q) ||
      s.statement.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q);
    return matchesMaturity && matchesQuery;
  });

  if (!tower) {
    return <Navigate to="/" replace />;
  }

  return (
    <Flex flexDirection="column" gap={16} padding={16}>
      <Flex flexDirection="column" gap={4}>
        <Heading level={1}>
          {tower.emoji} {tower.name}
        </Heading>
        <Paragraph>{tower.description}</Paragraph>
      </Flex>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search standards in this tower…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-label="Search standards"
        />
        <div className="maturity-filter">
          {(["all", "foundational", "advanced"] as const).map((m) => (
            <button
              key={m}
              className={maturityFilter === m ? "chip chip-active" : "chip"}
              onClick={() => setMaturityFilter(m)}
              type="button"
            >
              {m === "all" ? "All" : m === "foundational" ? "Foundational" : "Advanced"}
            </button>
          ))}
        </div>
      </div>

      <div className="standards-list">
        {filtered.map((s) => (
          <StandardCard key={s.id} standard={s} adopted={adopted.has(s.id)} onToggleAdopted={onToggleAdopted} />
        ))}
        {filtered.length === 0 && <Paragraph>No standards match that search.</Paragraph>}
      </div>
    </Flex>
  );
};

import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph, Code } from "@dynatrace/strato-components/typography";
import { standardById } from "../data/standards";
import { towerById } from "../data/towers";
import { MaturityBadge } from "../components/MaturityBadge";
import { GuidanceSteps } from "../components/GuidanceSteps";

const REPO_BASE = "https://github.com/sala769/udapeoplecicd/blob/master/";
const REPO_TREE_BASE = "https://github.com/sala769/udapeoplecicd/tree/master/";

function repoLink(path: string): string {
  const lastSegment = path.split("/").pop() ?? "";
  const looksLikeFile = lastSegment.includes(".");
  return (looksLikeFile ? REPO_BASE : REPO_TREE_BASE) + path;
}

interface Props {
  adopted: Set<string>;
  onToggleAdopted: (id: string) => void;
}

export const StandardPage = ({ adopted, onToggleAdopted }: Props) => {
  const { id = "" } = useParams();
  const standard = standardById(id);

  if (!standard) {
    return <Navigate to="/" replace />;
  }

  const tower = towerById(standard.towerId);
  const isAdopted = adopted.has(standard.id);

  return (
    <Flex flexDirection="column" gap={20} padding={16} className="standard-page">
      <div>
        {tower && (
          <Link to={`/tower/${tower.id}`} className="breadcrumb">
            ← {tower.emoji} {tower.name}
          </Link>
        )}
        <Flex alignItems="center" gap={8} className="standard-page-header">
          <span className="standard-card-id">{standard.id}</span>
          <MaturityBadge maturity={standard.maturity} />
        </Flex>
        <Heading level={1}>{standard.title}</Heading>
      </div>

      <label className="adopted-toggle">
        <input type="checkbox" checked={isAdopted} onChange={() => onToggleAdopted(standard.id)} />
        Mark as adopted in this repo
      </label>

      <section>
        <Heading level={3}>Standard</Heading>
        <Paragraph>{standard.statement}</Paragraph>
      </section>

      <section>
        <Heading level={3}>Why</Heading>
        <Paragraph>{standard.rationale}</Paragraph>
      </section>

      <section>
        <Heading level={3}>How to verify</Heading>
        <Paragraph>{standard.verification}</Paragraph>
      </section>

      {standard.relatedRepoPaths.length > 0 && (
        <section>
          <Heading level={3}>Where this applies today</Heading>
          <ul className="related-files">
            {standard.relatedRepoPaths.map((path) => (
              <li key={path}>
                <a href={repoLink(path)} target="_blank" rel="noreferrer">
                  <Code>{path}</Code>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <Heading level={3}>Build this in Dynatrace</Heading>
        <GuidanceSteps guidance={standard.dynatrace} />
      </section>
    </Flex>
  );
};

import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { towers } from "../data/towers";
import { standards } from "../data/standards";
import { TowerCard } from "../components/TowerCard";

export const Home = ({ adopted }: { adopted: Set<string> }) => {
  const totalAdopted = standards.filter((s) => adopted.has(s.id)).length;

  return (
    <Flex flexDirection="column" gap={24} padding={16}>
      <Flex flexDirection="column" gap={4}>
        <Heading level={1}>UdaPeople Control Tower</Heading>
        <Paragraph>
          Every architectural standard for UdaPeople, grouped into five towers. Each standard names the rule, why
          it exists, where it already applies in this repo, and exactly how to build the matching Dynatrace
          monitor for it — so &ldquo;follow the standard&rdquo; and &ldquo;instrument the standard&rdquo; are one
          step, not two.
        </Paragraph>
        <Paragraph className="home-summary">
          {totalAdopted} of {standards.length} standards marked adopted across this browser.
        </Paragraph>
      </Flex>

      <div className="towers-grid">
        {towers.map((tower) => (
          <TowerCard key={tower.id} tower={tower} adopted={adopted} />
        ))}
      </div>
    </Flex>
  );
};

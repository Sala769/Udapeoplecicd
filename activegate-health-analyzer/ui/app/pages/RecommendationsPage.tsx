import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { Link } from "@dynatrace/strato-components/typography";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { NeedArchive, variantFor } from "../components/Common";

export const RecommendationsPage = () => (
  <NeedArchive>
    {(a) => (
      <Flex flexDirection="column" gap={12} padding={24}>
        <Heading level={2}>Recommendations</Heading>
        {a.findings.map((f) => (
          <MessageContainer key={f.id} variant={variantFor(f.severity)}>
            <MessageContainer.Title>{f.title}</MessageContainer.Title>
            <MessageContainer.Description>
              <Paragraph>{f.detail}</Paragraph>
              <Paragraph><strong>Action:</strong> {f.action}</Paragraph>
              {f.links?.map((l) => (
                <div key={l.url}>
                  <Link href={l.url} target="_blank" rel="noreferrer">{l.label}</Link>
                </div>
              ))}
            </MessageContainer.Description>
          </MessageContainer>
        ))}
      </Flex>
    )}
  </NeedArchive>
);

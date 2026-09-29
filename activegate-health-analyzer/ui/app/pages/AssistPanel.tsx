import React, { useMemo } from "react";
import { CodeSnippet, MessageContainer } from "@dynatrace/strato-components/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { NeedArchive } from "../components/Common";
import type { Analysis } from "../lib/types";

const contextFor = (a: Analysis): string =>
  [
    `ActiveGate ${a.archive.hostname ?? "unknown"} version ${a.archive.version ?? "unknown"}`,
    `JVM -Xms ${a.archive.jvm.xmsMb ?? "?"} MB / -Xmx ${a.archive.jvm.xmxMb ?? "?"} MB`,
    "Findings:",
    ...a.findings.slice(0, 10).map((f) => `- [${f.severity}] ${f.title}`),
    "",
    "Question: explain the most severe finding and the safest next step.",
  ].join("\n");

const Ask = ({ a }: { a: Analysis }) => {
  const text = useMemo(() => contextFor(a), [a]);
  return (
    <Flex flexDirection="column" gap={12} padding={24}>
      <Heading level={2}>Ask Dynatrace Assist</Heading>
      <MessageContainer variant="primary">
        <MessageContainer.Title>Skill shipped with this app</MessageContainer.Title>
        <MessageContainer.Description>
          The activegate-health skill under dynatrace-intelligence/skills/ teaches Assist this app&apos;s error
          signatures and playbook. Once deployed, open Assist from the Dynatrace UI and paste the context below.
        </MessageContainer.Description>
      </MessageContainer>
      <Paragraph>Context to paste into Assist:</Paragraph>
      <CodeSnippet>{text}</CodeSnippet>
    </Flex>
  );
};

export const AssistPanel = () => <NeedArchive>{(a) => <Ask a={a} />}</NeedArchive>;

import React from "react";
import { GaugeChart } from "@dynatrace/strato-components/charts";
import { Flex } from "@dynatrace/strato-components/layouts";
import { MessageContainer } from "@dynatrace/strato-components/content";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { NeedArchive, variantFor } from "../components/Common";
import { fmtTs } from "../lib/format";

export const OverviewPage = () => (
  <NeedArchive>
    {(a) => (
      <Flex flexDirection="column" gap={16} padding={24}>
        <Heading level={2}>Overview</Heading>
        <Flex gap={24} alignItems="center" flexWrap="wrap">
          <div style={{ width: 220, height: 160 }}>
            <GaugeChart value={a.healthScore} min={0} max={100}>
              <GaugeChart.Label>Health score</GaugeChart.Label>
            </GaugeChart>
          </div>
          <Flex flexDirection="column">
            <Paragraph>Host: {a.archive.hostname ?? "unknown"}</Paragraph>
            <Paragraph>Version: {a.archive.version ?? "unknown"}</Paragraph>
            <Paragraph>Window: {fmtTs(a.archive.window.from)} to {fmtTs(a.archive.window.to)}</Paragraph>
            <Paragraph>
              JVM: -Xms {a.archive.jvm.xmsMb ?? "?"} MB / -Xmx {a.archive.jvm.xmxMb ?? "?"} MB
            </Paragraph>
            <Paragraph>
              Host: {a.archive.system.cpuCores ?? "?"} cores, {a.archive.system.memTotalMb ? Math.round(a.archive.system.memTotalMb / 1024) : "?"} GB RAM
            </Paragraph>
          </Flex>
        </Flex>
        <Heading level={3}>Top findings</Heading>
        {a.findings.slice(0, 5).map((f) => (
          <MessageContainer key={f.id} variant={variantFor(f.severity)}>
            <MessageContainer.Title>{f.title}</MessageContainer.Title>
            <MessageContainer.Description>{f.detail}</MessageContainer.Description>
          </MessageContainer>
        ))}
      </Flex>
    )}
  </NeedArchive>
);

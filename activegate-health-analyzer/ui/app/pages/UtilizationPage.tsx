import React from "react";
import { TimeseriesChart, convertToTimeseries } from "@dynatrace/strato-components/charts";
import { Flex } from "@dynatrace/strato-components/layouts";
import { MessageContainer, ProgressCircle } from "@dynatrace/strato-components/content";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { useDql } from "@dynatrace-sdk/react-hooks";
import { NeedArchive } from "../components/Common";
import { useAnalysis } from "../lib/AnalysisContext";
import { classifyHeapPattern, sizingConfig } from "../lib/analyzer";
import { seriesQueries, type Window } from "../lib/dqlQueries";

const Series = ({ title, query, onData }: { title: string; query: string; onData?: (v: number[]) => void }) => {
  const { data, isLoading, error } = useDql({ query });
  React.useEffect(() => {
    if (!onData || !data?.records?.length) return;
    const rec = data.records[0] as Record<string, unknown>;
    const first = Object.values(rec).find((v) => Array.isArray(v) && v.every((x) => x === null || typeof x === "number"));
    if (first) onData((first as (number | null)[]).filter((x): x is number => x !== null));
  }, [data, onData]);
  return (
    <Flex flexDirection="column" gap={4}>
      <Heading level={4}>{title}</Heading>
      {isLoading && <ProgressCircle />}
      {error && <Paragraph>Query failed: {error.message}</Paragraph>}
      {data?.records?.length ? (
        <TimeseriesChart data={convertToTimeseries(data.records, data.types)} gapPolicy="connect" variant="line" />
      ) : (
        !isLoading && !error && <Paragraph>No data in Grail for this window.</Paragraph>
      )}
    </Flex>
  );
};

export const UtilizationPage = () => {
  const { agId } = useAnalysis();
  const [oldGen, setOldGen] = React.useState<number[]>([]);
  return (
    <NeedArchive>
      {(a) => {
        const w: Window = a.archive.window;
        const { jvm, system } = a.archive;
        const pattern = classifyHeapPattern(oldGen, sizingConfig);
        return (
          <Flex flexDirection="column" gap={16} padding={24}>
            <Heading level={2}>Utilization and load</Heading>
            <Paragraph>
              Archive: -Xms {jvm.xmsMb ?? "?"} MB, -Xmx {jvm.xmxMb ?? "?"} MB, {system.cpuCores ?? "?"} cores,{" "}
              {system.memTotalMb ? Math.round(system.memTotalMb / 1024) : "?"} GB RAM. Sizing thresholds come from
              sizingConfig.json.
            </Paragraph>
            <MessageContainer variant="primary">
              <MessageContainer.Title>Read percentages against absolute load</MessageContainer.Title>
              <MessageContainer.Description>
                Self-monitoring percentages can look alarming with plenty of headroom. Check absolute values (traffic,
                dropped messages, GC time) before concluding the host is overloaded.
              </MessageContainer.Description>
            </MessageContainer>
            {pattern.pattern !== "insufficient-data" && (
              <MessageContainer variant={pattern.pattern === "normal" ? "success" : "warning"}>
                <MessageContainer.Title>Heap pattern: {pattern.pattern}</MessageContainer.Title>
                <MessageContainer.Description>{pattern.detail}</MessageContainer.Description>
              </MessageContainer>
            )}
            {a.archive.oomEvents.length > 0 && (
              <Paragraph>
                Correlate the {a.archive.oomEvents.length} OOM event(s) in the archive with heap and CPU spikes at the same
                timestamps; a spike suggests utilization, a steady climb suggests a leak or extension.
              </Paragraph>
            )}
            {!agId ? (
              <MessageContainer variant="warning">
                <MessageContainer.Title>ActiveGate entity ID not set</MessageContainer.Title>
                <MessageContainer.Description>Set it on the Upload page to load live metrics.</MessageContainer.Description>
              </MessageContainer>
            ) : (
              <>
                {Object.entries(seriesQueries(agId, w)).map(([k, s]) => (
                  <Series key={k} title={s.title} query={s.query} onData={k === "oldGen" ? setOldGen : undefined} />
                ))}
              </>
            )}
          </Flex>
        );
      }}
    </NeedArchive>
  );
};

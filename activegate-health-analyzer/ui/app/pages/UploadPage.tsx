import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dynatrace/strato-components/buttons";
import { MessageContainer, ProgressCircle } from "@dynatrace/strato-components/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { TextInput, FormField, Label } from "@dynatrace/strato-components/forms";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { useDql } from "@dynatrace-sdk/react-hooks";
import { parseArchive } from "../lib/archiveParser";
import { analyze } from "../lib/analyzer";
import { useAnalysis } from "../lib/AnalysisContext";
import { resolveAgQuery } from "../lib/dqlQueries";

const AgResolver = ({ hostname, onPick }: { hostname: string; onPick: (id: string) => void }) => {
  const { data, isLoading, error } = useDql({ query: resolveAgQuery(hostname) });
  if (isLoading) return <ProgressCircle />;
  if (error) return <Paragraph>Could not resolve ActiveGate entity automatically: {error.message}</Paragraph>;
  const rows = (data?.records ?? []) as { id?: string; "entity.name"?: string }[];
  if (!rows.length) return <Paragraph>No ActiveGate entity matched host &quot;{hostname}&quot;. Enter the ID manually.</Paragraph>;
  return (
    <Flex flexDirection="column" gap={8}>
      <Paragraph>Matching ActiveGate entities in this tenant:</Paragraph>
      {rows.map((r) => (
        <Button key={r.id} onClick={() => r.id && onPick(r.id)}>
          Use {r["entity.name"]} ({r.id})
        </Button>
      ))}
    </Flex>
  );
};

export const UploadPage = () => {
  const { analysis, setAnalysis, agId, setAgId } = useAnalysis();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [drag, setDrag] = useState(false);
  const navigate = useNavigate();

  const handle = useCallback(
    async (file?: File) => {
      if (!file) return;
      setBusy(true);
      setError(undefined);
      try {
        const parsed = await parseArchive(file);
        setAnalysis(analyze(parsed));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [setAnalysis],
  );

  return (
    <Flex flexDirection="column" gap={16} padding={24}>
      <Heading level={2}>ActiveGate Health Analyzer</Heading>
      <Paragraph>
        Upload an ActiveGate support archive (.zip). It is parsed in your browser; nothing is uploaded anywhere.
      </Paragraph>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${drag ? Colors.Border.Primary.Default : Colors.Border.Neutral.Default}`,
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
        }}
      >
        <Paragraph>Drag and drop the archive here, or choose a file</Paragraph>
        <input
          type="file"
          accept=".zip,application/zip"
          aria-label="ActiveGate support archive"
          onChange={(e) => void handle(e.target.files?.[0])}
        />
      </div>
      {busy && <ProgressCircle />}
      {error && (
        <MessageContainer variant="critical">
          <MessageContainer.Title>Could not read archive</MessageContainer.Title>
          <MessageContainer.Description>{error}</MessageContainer.Description>
        </MessageContainer>
      )}
      {analysis && (
        <Flex flexDirection="column" gap={12}>
          <Heading level={3}>Archive loaded: {analysis.archive.fileName}</Heading>
          <Paragraph>
            {analysis.archive.files.length} files, {analysis.archive.logs.length} log entries, host{" "}
            {analysis.archive.hostname ?? "unknown"}, version {analysis.archive.version ?? "unknown"}.
          </Paragraph>
          <FormField>
            <Label>ActiveGate entity ID (used for live DQL)</Label>
            <TextInput value={agId} onChange={setAgId} placeholder="ACTIVE_GATE-XXXXXXXXXXXXXXXX" />
          </FormField>
          {analysis.archive.hostname && !agId && <AgResolver hostname={analysis.archive.hostname} onPick={setAgId} />}
          <Flex>
            <Button variant="accent" color="primary" onClick={() => void navigate("/overview")}>
              View analysis
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

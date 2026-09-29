import React from "react";
import { IntentButton } from "@dynatrace/strato-components/buttons";
import { CodeSnippet } from "@dynatrace/strato-components/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { NeedArchive } from "../components/Common";
import { useAnalysis } from "../lib/AnalysisContext";
import { followups } from "../lib/dqlQueries";

export const DqlFollowupsPage = () => {
  const { agId } = useAnalysis();
  return (
    <NeedArchive>
      {(a) => (
        <Flex flexDirection="column" gap={16} padding={24}>
          <Heading level={2}>Run in Notebook</Heading>
          {!agId && <Paragraph>No entity ID set: queries use a placeholder. Set it on the Upload page.</Paragraph>}
          {followups(agId || "<AG_ID>", a.archive.window).map((f) => (
            <Flex key={f.title} flexDirection="column" gap={4}>
              <Heading level={4}>{f.title}</Heading>
              <CodeSnippet language="sql">{f.query}</CodeSnippet>
              <Flex>
                <IntentButton
                  payload={{ "dt.query": f.query }}
                  options={{ recommendedAppId: "dynatrace.notebooks", recommendedIntentId: "view-query" }}
                >
                  Open in Notebooks
                </IntentButton>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </NeedArchive>
  );
};

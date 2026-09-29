import React, { useMemo } from "react";
import { DataTable, type DataTableColumnDef } from "@dynatrace/strato-components/tables";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading, Paragraph } from "@dynatrace/strato-components/typography";
import { NeedArchive } from "../components/Common";
import { fmtTs } from "../lib/format";

interface Row {
  id: string;
  issue: string;
  severity: string;
  count: number;
  first: string;
  last: string;
  rfa: string;
  rootCause: string;
  resolution: string;
  sample: string;
}

const columns: DataTableColumnDef<Row>[] = [
  { id: "issue", header: "Issue", accessor: "issue", width: { type: "auto" } },
  { id: "severity", header: "Severity", accessor: "severity" },
  { id: "count", header: "Count", accessor: "count", alignment: "right" },
  { id: "first", header: "First seen", accessor: "first" },
  { id: "last", header: "Last seen", accessor: "last" },
  { id: "rfa", header: "RFA needed", accessor: "rfa" },
];

export const LogFindingsPage = () => (
  <NeedArchive>
    {(a) => <Inner a={a} />}
  </NeedArchive>
);

const Inner = ({ a }: { a: NonNullable<Parameters<Parameters<typeof NeedArchive>[0]["children"]>[0]> }) => {
  const rows = useMemo<Row[]>(
    () => [
      ...a.matches.map((m) => ({
        id: m.rule.id,
        issue: m.rule.title,
        severity: m.rule.severity,
        count: m.count,
        first: fmtTs(m.first),
        last: fmtTs(m.last),
        rfa: m.rule.rfaNeeded ? "Yes" : "No",
        rootCause: m.rule.rootCause,
        resolution: m.rule.resolution,
        sample: m.sample,
      })),
      ...a.unclassified.slice(0, 200).map((u) => ({
        id: u.key,
        issue: `Unclassified: ${u.sample.slice(0, 120)}`,
        severity: u.level === "ERROR" ? "warning" : "info",
        count: u.count,
        first: fmtTs(u.first),
        last: fmtTs(u.last),
        rfa: "Unknown",
        rootCause: "Unclassified, needs review.",
        resolution: "Add a rule to knownIssuesKb.json if this recurs.",
        sample: u.context,
      })),
    ],
    [a],
  );
  return (
    <Flex flexDirection="column" gap={16} padding={24}>
      <Heading level={2}>Log findings (last 7 days)</Heading>
      <Paragraph>
        {a.matches.length} known issue(s) matched, {a.unclassified.length} unclassified ERROR/WARNING pattern(s).
      </Paragraph>
      <DataTable data={rows} columns={columns} sortable resizable>
        <DataTable.ExpandableRow>
          {({ row }: { row: Row }) => (
            <DataTable.ExpandableRowWrapper>
              <Paragraph><strong>Root cause:</strong> {row.rootCause}</Paragraph>
              <Paragraph><strong>Resolution:</strong> {row.resolution}</Paragraph>
              <pre style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }}>{row.sample}</pre>
            </DataTable.ExpandableRowWrapper>
          )}
        </DataTable.ExpandableRow>
        <DataTable.Pagination defaultPageSize={25} />
      </DataTable>
    </Flex>
  );
};

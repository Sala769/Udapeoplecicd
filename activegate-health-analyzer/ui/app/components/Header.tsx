import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components/layouts";

const items: [string, string][] = [
  ["/", "Upload"],
  ["/overview", "Overview"],
  ["/logs", "Log findings"],
  ["/utilization", "Utilization"],
  ["/recommendations", "Recommendations"],
  ["/dql", "DQL follow-ups"],
  ["/assist", "Assist"],
];

export const Header = () => (
  <AppHeader>
    <AppHeader.Navigation>
      <AppHeader.Logo as={Link} to="/" />
      {items.map(([to, label]) => (
        <AppHeader.NavigationItem key={to} as={Link} to={to}>
          {label}
        </AppHeader.NavigationItem>
      ))}
    </AppHeader.Navigation>
  </AppHeader>
);

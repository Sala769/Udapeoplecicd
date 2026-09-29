import { PageLayout } from "@dynatrace/strato-components/layouts";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { AnalysisProvider } from "./lib/AnalysisContext";
import { AssistPanel } from "./pages/AssistPanel";
import { DqlFollowupsPage } from "./pages/DqlFollowupsPage";
import { LogFindingsPage } from "./pages/LogFindingsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { UploadPage } from "./pages/UploadPage";
import { UtilizationPage } from "./pages/UtilizationPage";

export const App = () => (
  <AnalysisProvider>
    <PageLayout>
      <PageLayout.Header>
        <Header />
      </PageLayout.Header>
      <PageLayout.Content>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/logs" element={<LogFindingsPage />} />
          <Route path="/utilization" element={<UtilizationPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/dql" element={<DqlFollowupsPage />} />
          <Route path="/assist" element={<AssistPanel />} />
        </Routes>
      </PageLayout.Content>
    </PageLayout>
  </AnalysisProvider>
);

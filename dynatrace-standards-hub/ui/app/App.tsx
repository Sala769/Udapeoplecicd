import React, { useCallback, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AppHeader, Flex, PageLayout } from "@dynatrace/strato-components/layouts";
import { NavBar } from "./components/NavBar";
import { Home } from "./pages/Home";
import { TowerPage } from "./pages/TowerPage";
import { StandardPage } from "./pages/StandardPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { loadAdopted, saveAdopted } from "./utils/adoption";

export const App = () => {
  const [adopted, setAdopted] = useState<Set<string>>(() => loadAdopted());

  const onToggleAdopted = useCallback((id: string) => {
    setAdopted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveAdopted(next);
      return next;
    });
  }, []);

  return (
    <PageLayout>
      <PageLayout.Header>
        <AppHeader />
      </PageLayout.Header>
      <PageLayout.Content>
        <Flex flexDirection="column" className="app-shell">
          <NavBar />
          <Routes>
            <Route path="/" element={<Home adopted={adopted} />} />
            <Route
              path="/tower/:towerId"
              element={<TowerPage adopted={adopted} onToggleAdopted={onToggleAdopted} />}
            />
            <Route path="/standard/:id" element={<StandardPage adopted={adopted} onToggleAdopted={onToggleAdopted} />} />
            <Route path="/checklist" element={<ChecklistPage adopted={adopted} onToggleAdopted={onToggleAdopted} />} />
          </Routes>
        </Flex>
      </PageLayout.Content>
    </PageLayout>
  );
};

import { Chart, registerables } from "chart.js";
import { NotionChart } from "./notion-chart";
import { useMemo } from "react";
import { ChartForm } from "./chart-form";

Chart.register(...registerables);

export function App() {
  const hasQuery = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    return query.size;
  }, []);

  if (!hasQuery) {
    return <ChartForm />;
  }

  return <NotionChart />;
}

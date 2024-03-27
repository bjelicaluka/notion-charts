import { useEffect, useState } from "react";
import {
  NumberProperty,
  TitleProperty,
  getNotionDatabase,
  initNotionClient,
} from "./notion-api";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function NotionChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [labels, setLabels] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Record<string, number[]>>({});

  useEffect(() => {
    setIsLoading(true);
    setLabels([]);
    setDatasets({});

    const queryParams = new URLSearchParams(window.location.search);
    const auth = queryParams.get("auth");
    if (!auth) {
      setErrorMessage("Missing auth token");
      setIsLoading(false);
      return;
    }

    initNotionClient(auth);

    const databaseId = queryParams.get("databaseId");

    const labelPropKey = queryParams.get("label");
    const valuePropKeys = queryParams.getAll("value");

    getNotionDatabase(databaseId)
      .then(async (db) => {
        // validate properties
        const availableProperties = db.getPropertyKeys();
        const missingProperties = [labelPropKey, ...valuePropKeys].filter(
          (p) => !availableProperties.includes(p)
        );

        if (missingProperties.length > 0) {
          setErrorMessage(
            `Missing properties: ${missingProperties.join(", ")}`
          );
          setIsLoading(false);
          return;
        }

        for (const valuePropKey of valuePropKeys) {
          const property = db.getProperty(valuePropKey);

          if (!property || property.type !== "number") {
            setErrorMessage(
              `Property ${valuePropKey} is not a number property`
            );
            setIsLoading(false);
            return;
          }
        }

        const pages = await db.query();

        for (const page of pages) {
          const label = page.getProperty(labelPropKey) as TitleProperty;
          if (!label || label.type !== "title") {
            setErrorMessage(`Label property is not a title property`);
            setIsLoading(false);
            return;
          }
          const labelValue = label.title[0].plain_text;

          for (const valuePropKey of valuePropKeys) {
            const value = page.getProperty(valuePropKey) as NumberProperty;
            if (value.type !== "number") {
              setErrorMessage(`Value property is not a number property`);
              setIsLoading(false);
              return;
            }

            if (!datasets[valuePropKey]) {
              datasets[valuePropKey] = [];
            }

            datasets[valuePropKey].push(value.number || 0);
          }

          setLabels((prev) => [...prev, labelValue]);
          setDatasets({ ...datasets });
        }

        setIsLoading(false);
      })
      .catch((e) => {
        setIsLoading(false);
        setErrorMessage("Failed to fetch data" + e.message);
      });
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("chart") as HTMLCanvasElement;

    let chart = null;
    if (canvas) {
      chart = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: Object.keys(datasets).map((key) => ({
            label: key,
            data: datasets[key],
            borderWidth: 1,
          })),
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [isLoading, errorMessage]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-red-500 h-full w-full flex items-center justify-center">
        {errorMessage}
      </div>
    );
  }

  return <canvas id="chart">{/* Chart goes here */}</canvas>;
}

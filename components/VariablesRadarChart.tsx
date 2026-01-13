"use client";

import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { BrandVariables } from "@/lib/brandVariables";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const LABELS = [
  "Arquetipos",
  "Motivadores",
  "NSE",
  "Núcleo público objetivo",
  "Código cultural",
  "Contradicción",
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type VariablesRadarChartProps = {
  brandsVariables: BrandVariables[];
};

export function VariablesRadarChart({
  brandsVariables,
}: VariablesRadarChartProps) {
  if (!brandsVariables.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-10 text-center text-sm text-zinc-400">
        Modulo de variables: selecciona al menos una marca para ver el mapa.
      </div>
    );
  }

  const brandCount = brandsVariables.length || 1;
  const sums = brandsVariables.reduce(
    (acc, brand) => {
      acc.nse += brand.nse;
      acc.cultural += brand.cultural;
      acc.motivacional += brand.motivacional;
      acc.nucleo += brand.nucleo;
      acc.innovacion += brand.innovacion;
      acc.contradiccion += brand.contradiccion;
      return acc;
    },
    {
      nse: 0,
      cultural: 0,
      motivacional: 0,
      nucleo: 0,
      innovacion: 0,
      contradiccion: 0,
    },
  );

  const groupAvg = {
    nse: sums.nse / brandCount,
    cultural: sums.cultural / brandCount,
    motivacional: sums.motivacional / brandCount,
    nucleo: sums.nucleo / brandCount,
    innovacion: sums.innovacion / brandCount,
    contradiccion: sums.contradiccion / brandCount,
  };

  const values = [
    clamp01(groupAvg.innovacion) * 100,
    clamp01(groupAvg.motivacional) * 100,
    clamp01(groupAvg.nse) * 100,
    clamp01(groupAvg.nucleo) * 100,
    clamp01(groupAvg.cultural) * 100,
    clamp01(groupAvg.contradiccion) * 100,
  ];

  const data = {
    labels: LABELS,
    datasets: [
      {
        label: "Perfil del grupo",
        data: values,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.25)",
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: "#e5e7eb",
          font: { size: 11 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#020617",
        titleColor: "#e5e7eb",
        bodyColor: "#e5e7eb",
        borderColor: "#52525b",
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: "#27272a",
        },
        grid: {
          color: "#27272a",
        },
        pointLabels: {
          color: "#a1a1aa",
          font: { size: 11 },
        },
        ticks: {
          display: false,
        },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Mapa de variables del grupo
        </h3>
      </div>
      <div className="h-[360px] w-full">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  updateContradiccionCultural,
  type ContradiccionValue,
} from "@/lib/groupMatch";
import {
  getPairInsight,
  type InsightTag,
} from "@/lib/pairInsights";

export type Pair = {
  brandA: string;
  brandAId: string;
  brandB: string;
  brandBId: string;
  pairScore: number | null;
  positives: string[];
  negatives: string[];
  variables: {
    arquetiposMarcas: string | null;
    motivadoresSimbolismos: string | null;
    nivelSocioeconomico: string | null;
    nucleoPubObj: string | null;
    codigoCultural: string | null;
    contradiccionCultural: string | null;
  };
};

type Props = {
  pairs: Pair[];
};

const VARIABLE_LABELS: Array<{
  key: keyof Pair["variables"];
  label: string;
}> = [
  { key: "arquetiposMarcas", label: "Arquetipos de marca" },
  { key: "motivadoresSimbolismos", label: "Motivadores / simbolismos" },
  { key: "nivelSocioeconomico", label: "Nivel socioeconómico" },
  { key: "nucleoPubObj", label: "Núcleo público objetivo" },
  { key: "codigoCultural", label: "Código cultural" },
  { key: "contradiccionCultural", label: "Contradicción cultural" },
];

const CONTRADICCION_OPTIONS: ContradiccionValue[] = [
  "Ninguna",
  "Parcial",
  "Alta",
];

const INSIGHT_TAG_LABELS: Record<InsightTag, string> = {
  alta_afinidad: "Alta afinidad",
  afinidad_parcial: "Afinidad parcial",
  contraste_compatible: "Contraste compatible",
  choque_cultural: "Choque cultural",
};

const INSIGHT_TAG_STYLES: Record<InsightTag, string> = {
  alta_afinidad: "border-emerald-400/40 text-emerald-200",
  afinidad_parcial: "border-cyan-400/40 text-cyan-200",
  contraste_compatible: "border-amber-400/30 text-amber-200",
  choque_cultural: "border-rose-400/40 text-rose-200",
};

const getScoreClass = (value: number | null | undefined) => {
  const normalized = normalizeToUnit(value);
  if (normalized === null) {
    return "text-zinc-400";
  }
  if (normalized >= 0.7) return "text-emerald-400";
  if (normalized >= 0.4) return "text-amber-400";
  return "text-rose-400";
};

const formatScore = (value: number | null | undefined) => {
  const normalized = normalizeToUnit(value);
  if (normalized === null) return "N/A";
  const percent = Math.round(normalized * 100);
  return `${percent}%`;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const parseNumericValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeToUnit = (value: unknown) => {
  const parsed = parseNumericValue(value);
  if (parsed === null) {
    return null;
  }
  if (Math.abs(parsed) > 1) {
    return clamp01(parsed / 100);
  }
  return clamp01(parsed);
};

const formatAsPercent = (value: unknown) => {
  const normalized = normalizeToUnit(value);
  if (normalized === null) return "—";
  const percent = Math.round(normalized * 100);
  return `${percent}%`;
};

const getVariableIntensityClasses = (value: unknown) => {
  const normalized = normalizeToUnit(value);
  if (normalized === null) {
    return "bg-black/60 border-white/15";
  }
  if (normalized >= 0.75) {
    return "bg-emerald-500/15 border-emerald-400/60 shadow-[0_5px_20px_rgba(16,185,129,0.2)]";
  }
  if (normalized >= 0.4) {
    return "bg-amber-400/15 border-amber-300/60 shadow-[0_5px_20px_rgba(251,191,36,0.2)]";
  }
  return "bg-red-500/15 border-red-400/60 shadow-[0_5px_20px_rgba(248,113,113,0.25)]";
};

const mapContradiccionValue = (
  value: string | null,
): ContradiccionValue => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "parcial") return "Parcial";
  if (normalized === "alta") return "Alta";
  return "Ninguna";
};

export default function CompatibilityPanel({
  pairs,
}: Props) {
  const [contradiccionSelections, setContradiccionSelections] = useState<
    Record<string, ContradiccionValue>
  >({});

  const handleContradiccionChange = async (
    cardKey: string,
    pairIndex: number,
    newValue: ContradiccionValue,
  ) => {
    setContradiccionSelections((prev) => ({
      ...prev,
      [cardKey]: newValue,
    }));

    try {
      await updateContradiccionCultural(pairIndex, newValue);
    } catch (error) {
      console.error("No se pudo actualizar la contradicción cultural:", error);
    }
  };

  if (!pairs.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_40px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-2">
        <h2 className="text-xl font-semibold tracking-wide text-white/90">
          Compatibilidad entre marcas
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pairs.map((pair, index) => {
          const cardKey = `${pair.brandAId}-${pair.brandBId}-${index}`;
          const currentContradiccion =
            contradiccionSelections[cardKey] ??
            mapContradiccionValue(pair.variables.contradiccionCultural);
          const insight = getPairInsight(pair);

          return (
            <article
              key={cardKey}
              className="flex h-full flex-col gap-5 rounded-xl border border-white/10 bg-black/60 p-5 text-sm text-white/80 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-wide text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                    {pair.brandA} <span className="text-white/70">+</span>{" "}
                    {pair.brandB}
                  </p>
                </div>
                <span
                  className={`text-base font-semibold ${getScoreClass(pair.pairScore)}`}
                >
                  {formatScore(pair.pairScore)}
                </span>
              </header>

              <div className="grid gap-3">
                {pair.positives.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      <span className="text-base leading-none text-emerald-300">
                        +
                      </span>
                      Positivos
                    </p>
                    <ul className="mt-1 space-y-1 text-emerald-100/80">
                      {pair.positives.map((item, idx) => (
                        <li
                          key={`pos-${cardKey}-${idx}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-emerald-400">+</span>
                          <span className="text-white/85">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pair.negatives.length > 0 && (
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-300">
                      <span className="text-base leading-none text-rose-300">
                        –
                      </span>
                      Negativos
                    </p>
                    <ul className="mt-1 space-y-1 text-rose-100/80">
                      {pair.negatives.map((item, idx) => (
                        <li
                          key={`neg-${cardKey}-${idx}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-rose-400">–</span>
                          <span className="text-white/85">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 text-sm text-zinc-300">
                {VARIABLE_LABELS.map(({ key, label }) => {
                  const value = pair.variables[key];

                  if (key === "contradiccionCultural") {
                    return (
                      <div
                        key={`${cardKey}-${key}`}
                        className="rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                      >
                        <p className="text-xs uppercase tracking-wide text-white/50">
                          {label}
                        </p>
                        <select
                          value={currentContradiccion}
                          onChange={(event) =>
                            handleContradiccionChange(
                              cardKey,
                              index,
                              event.target.value as ContradiccionValue,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 shadow-inner focus:border-white/60 focus:outline-none focus:ring-0"
                        >
                          {CONTRADICCION_OPTIONS.map((option) => (
                            <option
                              key={option}
                              value={option}
                              className="bg-black text-white"
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${cardKey}-${key}`}
                      className={`rounded-lg border px-4 py-3 text-center flex flex-col items-center justify-center gap-1 ${getVariableIntensityClasses(value)}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                        {label}
                      </span>
                      <span className="mt-1 text-xl font-extrabold text-white">
                        {formatAsPercent(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 shadow-inner">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${INSIGHT_TAG_STYLES[insight.tag]}`}
                >
                  {INSIGHT_TAG_LABELS[insight.tag]}
                </div>
                <p className="mt-3 text-sm text-white/85">{insight.text}</p>
              </div>

            </article>
          );
        })}
      </div>
    </section>
  );
}

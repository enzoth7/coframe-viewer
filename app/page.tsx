"use client";

import { useEffect, useMemo, useState } from "react";
import CompatibilityPanel, {
  type Pair,
} from "@/components/CompatibilityPanel";
import FuturisticDonut, { type Segment } from "@/components/FuturisticDonut";
import { VariablesRadarChart } from "@/components/VariablesRadarChart";
import {
  buildBrandVariablesForRadar,
  type BrandVariables,
} from "@/lib/brandVariables";
import { fetchBrands, type Brand } from "@/lib/coframeApi";

const BASE_SECONDS = 60;
const TARGET_DURATION = BASE_SECONDS;
const MAX_SLOT_SECONDS = 90;

const SLOT_COUNT = 5;

const BRAND_COLOR_PALETTE = [
  "#29A9FF",
  "#6C5BFF",
  "#38FFD9",
  "#FF8F3F",
  "#6FFFA3",
];

type GroupLevel = "ALTO" | "MEDIO" | "BAJO";

type BrandTiming = {
  baseSeconds: number;
  extraSeconds: number;
  extraSecondCost: number;
};

type GroupMatchResponse = {
  scoreGroup?: number | null;
  labelGroup?: string | null;
  pairs?: Pair[];
};

const getGroupLevel = (label?: string | null): GroupLevel | null => {
  if (!label) {
    return null;
  }
  const tone = label.toUpperCase();
  if (tone === "ALTO" || tone === "MEDIO" || tone === "BAJO") {
    return tone as GroupLevel;
  }
  return null;
};

const DEFAULT_EXTRA_SECOND_COST = 200;
const MAX_EXTRA_SECONDS = 300;

const formatCurrency = (value: number) =>
  `$${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;


export default function Home() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    Array(SLOT_COUNT).fill(""),
  );
  const [groupScore, setGroupScore] = useState<number | null>(null);
  const [labelGroup, setLabelGroup] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loadingScore, setLoadingScore] = useState(false);
  const [errorScore, setErrorScore] = useState<string | null>(null);
  const [brandTiming, setBrandTiming] = useState<Record<string, BrandTiming>>(
    {},
  );
  const [costoFijoEquipo, setCostoFijoEquipo] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"donut" | "radar">("donut");
  const [cpsPorMarca, setCpsPorMarca] = useState<Record<string, number>>(
    {},
  );
  const [costoPorMarca, setCostoPorMarca] = useState<Record<string, number>>(
    {},
  );
  const [costoExtraPorMarca, setCostoExtraPorMarca] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    async function loadBrands() {
      try {
        const data = await fetchBrands();
        if (!data.length) {
          throw new Error("No se encontraron marcas en el endpoint.");
        }
        setBrands(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las marcas.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, []);

  const handleChange = (slotIndex: number, value: string) => {
    setSelectedIds((prev) => {
      const copy = [...prev];
      copy[slotIndex] = value;
      return copy;
    });
  };

  const selectedNames = selectedIds
    .map((id) => brands.find((brand) => brand.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const selectedBrandIds = selectedIds.filter((id) => id !== "");
  const canCalculateGroup = selectedBrandIds.length >= 2;

  useEffect(() => {
    setBrandTiming((prev) => {
      const next = { ...prev };
      let changed = false;

      selectedBrandIds.forEach((brandId) => {
        if (!next[brandId]) {
          next[brandId] = {
            baseSeconds: 0,
            extraSeconds: 0,
            extraSecondCost: DEFAULT_EXTRA_SECOND_COST,
          };
          changed = true;
        }
      });

      Object.keys(next).forEach((brandId) => {
        if (!selectedBrandIds.includes(brandId)) {
          delete next[brandId];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedBrandIds]);
  const timingStats = useMemo(() => {
    let totalBaseSeconds = 0;
    let totalExtraSeconds = 0;
    let costoExtraTotal = 0;

    Object.values(brandTiming).forEach((timing) => {
      totalBaseSeconds += timing.baseSeconds ?? 0;
      totalExtraSeconds += timing.extraSeconds ?? 0;
      costoExtraTotal +=
        (timing.extraSeconds ?? 0) * (timing.extraSecondCost ?? 0);
    });

    return {
      totalBaseSeconds,
      totalExtraSeconds,
      totalSeconds: totalBaseSeconds + totalExtraSeconds,
      costoExtraTotal,
    };
  }, [brandTiming]);

  const {
    totalBaseSeconds,
    totalExtraSeconds,
    totalSeconds,
    costoExtraTotal,
  } = timingStats;

  const costoTotal = costoFijoEquipo + costoExtraTotal;

  useEffect(() => {
    if (!Object.keys(brandTiming).length) {
      setCpsPorMarca({});
      setCostoPorMarca({});
      setCostoExtraPorMarca({});
      return;
    }

    const nextCps: Record<string, number> = {};
    const nextCostoPorMarca: Record<string, number> = {};
    const nextCostoExtraPorMarca: Record<string, number> = {};

    const totalBaseSecondsAll = Object.values(brandTiming).reduce(
      (sum, timing) => sum + (timing.baseSeconds ?? 0),
      0,
    );

    Object.entries(brandTiming).forEach(([brandId, timing]) => {
      const baseSeconds = timing.baseSeconds ?? 0;
      const extraSeconds = timing.extraSeconds ?? 0;
      const secondsMarca = baseSeconds + extraSeconds;

      const costoFijoPorMarca =
        totalBaseSecondsAll > 0
          ? (costoFijoEquipo * baseSeconds) / totalBaseSecondsAll
          : 0;

      const costoExtraMarca = extraSeconds * (timing.extraSecondCost ?? 0);
      const costoMarca = costoFijoPorMarca + costoExtraMarca;

      nextCostoPorMarca[brandId] = costoMarca;
      nextCostoExtraPorMarca[brandId] = costoExtraMarca;

      nextCps[brandId] =
        secondsMarca > 0 ? costoMarca / Math.max(secondsMarca, 1) : 0;
    });

    setCpsPorMarca(nextCps);
    setCostoPorMarca(nextCostoPorMarca);
    setCostoExtraPorMarca(nextCostoExtraPorMarca);
  }, [brandTiming, costoFijoEquipo, totalBaseSeconds]);

  const segments: Segment[] = selectedIds
    .map((id, index) => {
      if (!id) {
        return null;
      }
      const timing = brandTiming[id];
      const totalSecondsForBrand =
        (timing?.baseSeconds ?? 0) + (timing?.extraSeconds ?? 0);
      if (totalSecondsForBrand <= 0) {
        return null;
      }
      const brand = brands.find((item) => item.id === id);
      const baseColor =
        brand?.color ??
        BRAND_COLOR_PALETTE[index % BRAND_COLOR_PALETTE.length];

      return {
        label: brand?.name ?? `Marca ${index + 1}`,
        value: totalSecondsForBrand,
        color: baseColor,
        brandId: id,
      };
    })
    .filter((segment): segment is Segment => Boolean(segment));

  const brandColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    selectedIds.forEach((id, index) => {
      if (!id) return;
      const brand = brands.find((item) => item.id === id);
      map[id] =
        brand?.color ??
        BRAND_COLOR_PALETTE[index % BRAND_COLOR_PALETTE.length];
    });
    return map;
  }, [selectedIds, brands]);

  const brandVariables = useMemo<BrandVariables[]>(() => {
    const uniqueIds = Array.from(new Set(selectedIds.filter(Boolean)));
    const selectedBrandDetails = uniqueIds.map((brandId, index) => {
      const brand = brands.find((item) => item.id === brandId);
      return {
        id: brandId,
        name: brand?.name ?? `Marca ${index + 1}`,
        color:
          brandColorMap[brandId] ??
          brand?.color ??
          BRAND_COLOR_PALETTE[index % BRAND_COLOR_PALETTE.length],
      };
    });

    return buildBrandVariablesForRadar({
      selectedBrands: selectedBrandDetails,
      compatibilityPairs: pairs,
    });
  }, [selectedIds, pairs, brands, brandColorMap]);

  if (process.env.NODE_ENV === "development") {
    console.log("brandVariables", brandVariables);
  }

  const totalStatusClass =
    totalSeconds === TARGET_DURATION
      ? "text-emerald-300"
      : totalSeconds < TARGET_DURATION
        ? "text-amber-300"
        : "text-rose-300";

  const assignedRatio =
    BASE_SECONDS > 0 ? Math.min(1, totalSeconds / BASE_SECONDS) : 0;

  const updateBrandTiming = (
    brandId: string,
    partial: Partial<BrandTiming>,
  ) => {
    setBrandTiming((prev) => {
      const current = prev[brandId];
      if (!current) {
        return prev;
      }
      const nextValue: BrandTiming = {
        ...current,
        ...partial,
      };
      if (
        nextValue.baseSeconds === current.baseSeconds &&
        nextValue.extraSeconds === current.extraSeconds &&
        nextValue.extraSecondCost === current.extraSecondCost
      ) {
        return prev;
      }
      return {
        ...prev,
        [brandId]: nextValue,
      };
    });
  };

  const handleBaseSecondsAdjust = (brandId: string, delta: number) => {
    const current = brandTiming[brandId];
    if (!current) return;
    const nextValue = Math.max(
      0,
      Math.min(MAX_SLOT_SECONDS, current.baseSeconds + delta),
    );
    updateBrandTiming(brandId, { baseSeconds: nextValue });
  };

  const handleExtraSecondsAdjust = (brandId: string, delta: number) => {
    const current = brandTiming[brandId];
    if (!current) return;
    const nextValue = Math.max(
      0,
      Math.min(MAX_EXTRA_SECONDS, current.extraSeconds + delta),
    );
    updateBrandTiming(brandId, { extraSeconds: nextValue });
  };

  const handleExtraSecondCostChange = (brandId: string, value: number) => {
    if (!Number.isFinite(value)) {
      updateBrandTiming(brandId, { extraSecondCost: 0 });
      return;
    }
    updateBrandTiming(brandId, {
      extraSecondCost: Math.max(0, value),
    });
  };

  const labelToneClass = (label?: string | null) => {
    const tone = getGroupLevel(label);
    if (tone === "ALTO") {
      return "bg-emerald-500/20 text-emerald-300";
    }
    if (tone === "MEDIO") {
      return "bg-amber-500/20 text-amber-300";
    }
    if (tone === "BAJO") {
      return "bg-rose-500/20 text-rose-300";
    }
    return "bg-white/10 text-white/80";
  };

  const activeGroupLevel = getGroupLevel(labelGroup);
  const pillLabel = activeGroupLevel ?? labelGroup;
  const scoreLevelClass =
    activeGroupLevel === "ALTO"
      ? "bg-emerald-500/10 border-emerald-400/60 shadow-[0_0_30px_rgba(34,197,94,0.7)] score-high-glow"
      : activeGroupLevel === "MEDIO"
        ? "bg-amber-500/10 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] score-medium-pulse"
        : activeGroupLevel === "BAJO"
          ? "bg-rose-500/10 border-rose-400/40 shadow-[0_0_18px_rgba(248,113,113,0.25)] score-low-breathe"
          : "shadow-[0_0_18px_rgba(15,15,15,0.65)]";

  const handleCalculateGroup = async () => {
    setLoadingScore(true);
    setErrorScore(null);
    setLabelGroup(null);
    setPairs([]);

    try {
      const response = await fetch("/api/group-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brandIds: selectedBrandIds }),
      });

      const data: GroupMatchResponse = await response.json();

      if (!response.ok) {
        setGroupScore(null);
        setLabelGroup(null);
        setPairs([]);
        setErrorScore(
          (data as { message?: string; error?: string })?.message ??
            (data as { message?: string; error?: string })?.error ??
            "No se pudo calcular el grupo.",
        );
        return;
      }

      setGroupScore(data.scoreGroup ?? null);
      setLabelGroup(data.labelGroup ?? null);
      setPairs(Array.isArray(data.pairs) ? data.pairs : []);
      setErrorScore(null);
    } catch (err) {
      setGroupScore(null);
      setLabelGroup(null);
      setPairs([]);
      setErrorScore(
        err instanceof Error
          ? err.message
          : "Error desconocido al calcular el grupo.",
      );
    } finally {
      setLoadingScore(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <p className="text-sm text-white/80">Cargando marcas...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <p className="rounded border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <main className="mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white">
            COFRAME – Análisis de Compatibilidad de Marcas
          </h1>
          <p className="text-sm text-white/70">
            Seleccioná hasta 5 marcas para explorar la estructura del grupo.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            {Array.from({ length: SLOT_COUNT }).map((_, index) => {
              const brandId = selectedIds[index];
              const timing = brandId ? brandTiming[brandId] : null;
              const baseSeconds = timing?.baseSeconds ?? 0;
              const extraSeconds = timing?.extraSeconds ?? 0;
              const extraCost = timing?.extraSecondCost ?? DEFAULT_EXTRA_SECOND_COST;
              const totalExtraCost = extraSeconds * extraCost;
              const totalSecondsForBrand = baseSeconds + extraSeconds;
              const costoMarca = brandId ? costoPorMarca[brandId] ?? 0 : 0;

              return (
                <div key={`slot-${index}`} className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    MARCA {index + 1}
                  </label>
                  <select
                    value={brandId}
                    onChange={(event) =>
                      handleChange(index, event.target.value || "")
                    }
                    className="w-full rounded border border-white/20 bg-black/60 p-3 text-white shadow-inner focus:border-white focus:outline-none"
                  >
                    <option value="">Seleccionar marca...</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>

                  {brandId && timing && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                          Segundos normales (pack)
                        </p>
                        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/60 px-3 py-2">
                          <button
                            type="button"
                            aria-label="Restar segundos normales"
                            onClick={() => handleBaseSecondsAdjust(brandId, -1)}
                            disabled={baseSeconds <= 0}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-white">
                            {baseSeconds}s
                          </span>
                          <button
                            type="button"
                            aria-label="Sumar segundos normales"
                            onClick={() => handleBaseSecondsAdjust(brandId, 1)}
                            disabled={baseSeconds >= MAX_SLOT_SECONDS}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                          Segundos extra (upsell)
                        </p>
                        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/60 px-3 py-2">
                          <button
                            type="button"
                            aria-label="Restar segundos extra"
                            onClick={() => handleExtraSecondsAdjust(brandId, -1)}
                            disabled={extraSeconds <= 0}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-white">
                            {extraSeconds}s
                          </span>
                          <button
                            type="button"
                            aria-label="Sumar segundos extra"
                            onClick={() => handleExtraSecondsAdjust(brandId, 1)}
                            disabled={extraSeconds >= MAX_EXTRA_SECONDS}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                          <span>Costo por segundo extra</span>
                          <input
                            type="number"
                            min={0}
                            value={extraCost}
                            onChange={(event) =>
                              handleExtraSecondCostChange(
                                brandId,
                                Number(event.target.value) || 0,
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </label>

                        <p className="text-xs text-white/80">
                          Total costo extra: {formatCurrency(totalExtraCost)}
                        </p>
                        <div className="mt-3 rounded-xl bg-emerald-500/15 border border-emerald-400 px-3 py-2.5 flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                            Inversión estimada
                          </span>
                          <span className="text-base md:text-lg font-semibold text-white">
                            {totalSecondsForBrand > 0
                              ? formatCurrency(costoMarca)
                              : formatCurrency(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-4 rounded-2xl bg-zinc-900/80 border border-zinc-700 px-4 py-3">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-amber-300 uppercase">
                <span>Total asignado</span>
                <span className="text-[11px] text-amber-200">
                  Pack {BASE_SECONDS}s
                </span>
              </div>
              <div
                className={`mt-1 flex items-baseline justify-between ${totalStatusClass}`}
              >
                <span className="text-xl font-semibold text-white">
                  {totalSeconds}s
                </span>
                <span className="text-sm text-zinc-300">
                  / {BASE_SECONDS}s
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${assignedRatio * 100}%` }}
                />
              </div>
            </div>

          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950/60 to-black/60 p-5">
            <button
              type="button"
              onClick={handleCalculateGroup}
              disabled={loadingScore || !canCalculateGroup}
              className="mx-auto flex h-16 w-full max-w-xl items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-500 text-white text-sm font-semibold uppercase tracking-[0.18em] shadow-[0_0_35px_rgba(34,197,94,0.55)] transition-transform duration-200 hover:scale-[1.01] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:brightness-100 sm:text-base"
            >
              CALCULAR GRUPO
            </button>
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-6 py-6 text-center">
              {loadingScore && (
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                  Calculando...
                </p>
              )}
              {!loadingScore && errorScore && (
                <p className="text-sm text-amber-400">{errorScore}</p>
              )}
              {!loadingScore && !errorScore && groupScore !== null && (
                <div
                  className={`mx-auto mt-2 inline-flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/60 px-5 py-4 text-center backdrop-blur-sm transition-all duration-300 ${scoreLevelClass}`}
                >
                  <span className="text-[11px] tracking-[0.22em] text-zinc-300 uppercase sm:text-xs">
                    Score del grupo
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-semibold text-white sm:text-5xl">
                      {groupScore.toFixed(2)}
                    </span>
                    {pillLabel && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${labelToneClass(
                          pillLabel,
                        )}`}
                      >
                        {pillLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!loadingScore && !errorScore && groupScore === null && (
                <p className="text-sm text-white/70">
                  {canCalculateGroup
                    ? "Presioná CALCULAR GRUPO para ver un score aquí."
                    : "Seleccioná al menos 2 marcas para habilitar el cálculo."}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4">
              <div className="mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-400 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">
                  Costo total estimado
                </p>
                <p className="mt-1 text-3xl font-semibold text-white">
                  {formatCurrency(costoTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Inversión del videoclip
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Ajusta el pack y los costos para estimar la inversión total.
                </p>
              </div>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                <span>Costo del proyecto</span>
                <input
                  type="number"
                  value={costoFijoEquipo}
                  onChange={(event) =>
                    setCostoFijoEquipo(Number(event.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none"
                />
              </label>

              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-base font-semibold text-white space-y-1">
                <p>
                  Pack base:{" "}
                  <span className="font-semibold text-amber-300">
                    {BASE_SECONDS}s
                  </span>{" "}
                  incluidos
                </p>
                <p>
                  Segundos normales usados:{" "}
                  <span className="font-semibold text-amber-300">
                    {totalBaseSeconds}s
                  </span>
                </p>
                <p>
                  Segundos extra comprados:{" "}
                  <span className="font-semibold text-amber-300">
                    {totalExtraSeconds}s
                  </span>
                </p>
                <p>
                  Costo extra total:{" "}
                  <span className="font-semibold text-amber-300">
                    {formatCurrency(costoExtraTotal)}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4">
              <div className="mb-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("donut")}
                  className={
                    "px-4 py-2 rounded-xl border transition-all uppercase tracking-[0.18em] text-xs " +
                    (activeTab === "donut"
                      ? "border-emerald-400 text-emerald-300"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600")
                  }
                >
                  Distribución
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("radar")}
                  className={
                    "px-4 py-2 rounded-xl border transition-all uppercase tracking-[0.18em] text-xs " +
                    (activeTab === "radar"
                      ? "border-emerald-400 text-emerald-300"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600")
                  }
                >
                  Variables
                </button>
              </div>

              {activeTab === "donut" && (
                <FuturisticDonut
                  segments={segments}
                  costoPorMarca={costoPorMarca}
                  costoExtraPorMarca={costoExtraPorMarca}
                  cpsPorMarca={cpsPorMarca}
                />
              )}

              {activeTab === "radar" && (
                <VariablesRadarChart brandsVariables={brandVariables} />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-white/80">
          {selectedNames.length ? (
            <>
              Marcas seleccionadas: {selectedNames.join(", ")}.
            </>
          ) : (
            <>Marcas seleccionadas: ninguna.</>
          )}
        </div>

        {pairs.length > 0 && (
          <CompatibilityPanel pairs={pairs} />
        )}
      </main>
    </div>
  );
}

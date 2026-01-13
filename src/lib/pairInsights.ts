import type { Pair } from "@/components/CompatibilityPanel";

export type InsightTag =
  | "alta_afinidad"
  | "afinidad_parcial"
  | "contraste_compatible"
  | "choque_cultural";

export interface PairInsight {
  text: string;
  tag: InsightTag;
}

type ContradictionLevel = "ninguna" | "parcial" | "alta";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const normalizeToUnit = (value: unknown): number | null => {
  const parsed = parseNumericValue(value);
  if (parsed === null) return null;
  return Math.abs(parsed) > 1 ? clamp01(parsed / 100) : clamp01(parsed);
};

const average = (values: Array<number | null>): number | null => {
  const filtered = values.filter(
    (value): value is number => typeof value === "number",
  );
  if (!filtered.length) return null;
  const sum = filtered.reduce((acc, value) => acc + value, 0);
  return sum / filtered.length;
};

const templates: Record<InsightTag, Array<(pairName: string) => string>> = {
  alta_afinidad: [
    (pairName) =>
      `${pairName} operan casi en espejo: base cultural sólida y motivadores alineados; conviene diferenciar roles para evitar solaparse.`,
    (pairName) =>
      `Alta sintonía. ${pairName} comparten estructura y tono, así que la curaduría debe apuntar a matices específicos.`,
  ],
  afinidad_parcial: [
    (pairName) =>
      `Afinidad moderada entre ${pairName}: el piso común existe, pero aún hay espacio para ajustar motivadores y NSE.`,
    (pairName) =>
      `${pairName} comparten una base relevante sin ser idénticas; se pueden coordinar resaltando los matices de cada una.`,
  ],
  contraste_compatible: [
    (pairName) =>
      `Contraste manejable: ${pairName} aportan matices distintos y el mix se siente complementario si se orquesta bien.`,
    (pairName) =>
      `${pairName} no son espejo, pero se pueden combinar para cubrir más territorio sin fricciones fuertes.`,
  ],
  choque_cultural: [
    (pairName) =>
      `Fricción alta entre ${pairName}: pisan escenarios culturales distintos y la convivencia requiere coreografía cuidadosa.`,
    (pairName) =>
      `${pairName} chocan en cultura y motivación; si comparten espacio, hay que delimitar claramente roles y tonos.`,
  ],
};

const pickTemplate = (tag: InsightTag, pairName: string) => {
  const variants = templates[tag];
  if (!variants.length) return `${pairName} presentan un mix particular.`;
  const seed = pairName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[Math.abs(seed) % variants.length](pairName);
};

export function getPairInsight(pair: Pair): PairInsight {
  const vars = pair.variables;

  const codigoScore = normalizeToUnit(vars.codigoCultural);
  const nucleoScore = normalizeToUnit(vars.nucleoPubObj);
  const arquetiposScore = normalizeToUnit(vars.arquetiposMarcas);
  const motivadoresScore = normalizeToUnit(vars.motivadoresSimbolismos);
  const socioScore = normalizeToUnit(vars.nivelSocioeconomico);

  const coreScore = average([codigoScore, nucleoScore]);
  const supportScore = average([
    arquetiposScore,
    motivadoresScore,
    socioScore,
  ]);
  const groupScoreVar = average(
    [coreScore, supportScore].filter(
      (value): value is number => value !== null,
    ),
  );

  const rawContr = vars.contradiccionCultural || "";
  const normalizedContr = normalizeText(rawContr);
  let contrLevel: ContradictionLevel = "ninguna";
  if (normalizedContr.includes("alta")) {
    contrLevel = "alta";
  } else if (
    normalizedContr.includes("parcial") ||
    normalizedContr.includes("media")
  ) {
    contrLevel = "parcial";
  }

  let tag: InsightTag;
  if (
    coreScore !== null &&
    groupScoreVar !== null &&
    coreScore >= 0.8 &&
    groupScoreVar >= 0.7 &&
    contrLevel !== "alta"
  ) {
    tag = "alta_afinidad";
  } else if (
    coreScore !== null &&
    coreScore >= 0.6 &&
    contrLevel !== "alta"
  ) {
    tag = "afinidad_parcial";
  } else if (contrLevel === "alta" && (coreScore === null || coreScore < 0.75)) {
    tag = "choque_cultural";
  } else {
    tag = "contraste_compatible";
  }

  const pairName =
    pair.brandA && pair.brandB
      ? `${pair.brandA} y ${pair.brandB}`
      : "las dos marcas";
  const text = pickTemplate(tag, pairName);

  return {
    text,
    tag,
  };
}

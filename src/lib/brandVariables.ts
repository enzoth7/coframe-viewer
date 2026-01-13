import type { Pair } from "@/components/CompatibilityPanel";

export type BrandVariables = {
  brandId: string;
  name: string;
  color: string;
  nse: number;
  cultural: number;
  motivacional: number;
  nucleo: number;
  innovacion: number;
  contradiccion: number;
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

const toSafeNumber = (value: unknown): number =>
  normalizeToUnit(value) ?? 0;

const normalizeToken = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
};

const createBrandTokenSet = (brand: SimpleBrand) => {
  const tokens = new Set<string>();
  [brand.id, brand.name].forEach((candidate) => {
    const normalized = normalizeToken(candidate);
    if (normalized) {
      tokens.add(normalized);
    }
  });
  return tokens;
};

const pairMatchesBrand = (pair: Pair, tokens: Set<string>) => {
  const normalizedAId = normalizeToken(pair.brandAId);
  const normalizedAName = normalizeToken(pair.brandA);
  const normalizedBId = normalizeToken(pair.brandBId);
  const normalizedBName = normalizeToken(pair.brandB);

  if (
    (normalizedAId && tokens.has(normalizedAId)) ||
    (!normalizedAId && normalizedAName && tokens.has(normalizedAName))
  ) {
    return true;
  }

  if (
    (normalizedBId && tokens.has(normalizedBId)) ||
    (!normalizedBId && normalizedBName && tokens.has(normalizedBName))
  ) {
    return true;
  }

  return false;
};

type SimpleBrand = {
  id: string;
  name: string;
  color: string;
};

type BuildBrandVariablesArgs = {
  selectedBrands: SimpleBrand[];
  compatibilityPairs: Pair[];
};

export function buildBrandVariablesForRadar({
  selectedBrands,
  compatibilityPairs,
}: BuildBrandVariablesArgs): BrandVariables[] {
  return selectedBrands.map((brand) => {
    const brandTokens = createBrandTokenSet(brand);

    const aggregate = compatibilityPairs.reduce(
      (acc, pair) => {
        if (!pairMatchesBrand(pair, brandTokens)) {
          return acc;
        }

        acc.count += 1;
        const variables = pair.variables ?? {};
        acc.nse += toSafeNumber(variables?.nivelSocioeconomico);
        acc.cultural += toSafeNumber(variables?.codigoCultural);
        acc.motivacional += toSafeNumber(variables?.motivadoresSimbolismos);
        acc.nucleo += toSafeNumber(variables?.nucleoPubObj);
        acc.innovacion += toSafeNumber(variables?.arquetiposMarcas);
        acc.contradiccion += toSafeNumber(variables?.contradiccionCultural);
        return acc;
      },
      {
        count: 0,
        nse: 0,
        cultural: 0,
        motivacional: 0,
        nucleo: 0,
        innovacion: 0,
        contradiccion: 0,
      },
    );

    const divisor = aggregate.count || 1;

    return {
      brandId: brand.id,
      name: brand.name,
      color: brand.color,
      nse: aggregate.nse / divisor,
      cultural: aggregate.cultural / divisor,
      motivacional: aggregate.motivacional / divisor,
      nucleo: aggregate.nucleo / divisor,
      innovacion: aggregate.innovacion / divisor,
      contradiccion: aggregate.contradiccion / divisor,
    };
  });
}

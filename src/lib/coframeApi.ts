export type Brand = {
  id: string;
  name: string;
  color?: string;
  score?: number;
};

type LegacyRow = Record<string, unknown>;

type SheetResponse = {
  sheet: string;
  brands?: Brand[];
  rows?: LegacyRow[];
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const mapLegacyRowsToBrands = (rows: LegacyRow[]): Brand[] =>
  rows
    .map((row, index) => {
      const fallback = `Marca ${index + 1}`;
      const nameCandidate = normalizeString(row["NOMBRE_MARCA"]) || "";

      if (!nameCandidate || nameCandidate.toUpperCase() === "NOMBRE_MARCA") {
        return null;
      }

      const idCandidate =
        normalizeString(row["ID_MARCA"]) ||
        normalizeString(row["ID"]) ||
        nameCandidate ||
        fallback;

      return { id: idCandidate, name: nameCandidate };
    })
    .filter((brand): brand is Brand => Boolean(brand));

export async function fetchBrands(): Promise<Brand[]> {
  const url = process.env.NEXT_PUBLIC_COFRA_SHEETS_URL;
  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_COFRA_SHEETS_URL");
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error al traer marcas (${response.status}).`);
  }

  const data = (await response.json()) as SheetResponse;

  if (Array.isArray(data?.brands) && data.brands.length) {
    return data.brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
    }));
  }

  if (Array.isArray(data?.rows)) {
    const legacyBrands = mapLegacyRowsToBrands(data.rows);
    if (legacyBrands.length) {
      return legacyBrands;
    }
  }

  throw new Error(
    "El endpoint no devolvió el array 'brands' ni filas compatibles.",
  );
}

import { fetchBrands } from "@/lib/coframeApi";

export default async function ViewerPage() {
  const brands = await fetchBrands();

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-3xl font-semibold">COFRAME Viewer</h1>

      <div className="space-y-2">
        <label htmlFor="brand-select" className="text-sm font-medium">
          Seleccioná marcas (2–5)
        </label>
        <select
          id="brand-select"
          multiple
          className="border rounded w-full p-2 min-h-[160px]"
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <pre className="rounded bg-slate-900 p-4 text-xs text-white">
        {JSON.stringify(brands.slice(0, 3), null, 2)}
      </pre>
    </main>
  );
}

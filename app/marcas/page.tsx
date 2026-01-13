// app/marcas/page.tsx
import { fetchBrands, type Brand } from "@/lib/coframeApi";

export default async function MarcasPage() {
  let brands: Brand[] = [];
  let error: string | null = null;

  try {
    brands = await fetchBrands();
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Error desconocido al consultar el endpoint de Marcas.";
  }

  return (
    <main className="p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Data preview
        </p>
        <h1 className="text-xl font-bold">MARCAS (preview)</h1>
        <p className="text-sm text-slate-500">
          Lectura directa desde NEXT_PUBLIC_COFRA_SHEETS_URL.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">No se pudo traer datos.</p>
          <p>{error}</p>
        </div>
      ) : (
        <pre className="rounded-2xl bg-slate-900 p-4 text-xs text-slate-50">
          {JSON.stringify(brands.slice(0, 5), null, 2)}
        </pre>
      )}
    </main>
  );
}

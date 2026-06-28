"use client";

import { useState, useEffect } from "react";
import { validateBIC, parseBIC, loadBlzData, IBAN_COUNTRIES, type BlzEntry } from "@/lib/iban";

export default function BicSearch() {
  const [mode, setMode] = useState<"blz" | "bic">("blz");
  const [query, setQuery] = useState("");
  const [blzResult, setBlzResult] = useState<BlzEntry | null | "not-found">(null);
  const [bicResults, setBicResults] = useState<BlzEntry[]>([]);
  const [bicValidation, setBicValidation] = useState<ReturnType<typeof validateBIC> | null>(null);
  const [blzList, setBlzList] = useState<BlzEntry[]>([]);
  const [blzMap, setBlzMap] = useState<Map<string, BlzEntry> | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadBlzData().then(({ list, map }) => {
      setBlzList(list);
      setBlzMap(map);
      setLoaded(true);
    });
  }, []);

  function handleSearch() {
    if (!loaded) return;
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    if (mode === "blz") {
      const entry = blzMap?.get(clean) ?? null;
      setBlzResult(entry ?? "not-found");
    } else {
      const validation = validateBIC(clean);
      setBicValidation(validation);
      if (validation.valid) {
        // Match on first 8 chars (ignore branch suffix)
        const prefix = clean.slice(0, 8);
        const matches = blzList.filter(e => e.bic.startsWith(prefix));
        setBicResults(matches);
      } else {
        setBicResults([]);
      }
    }
  }

  function switchMode(m: "blz" | "bic") {
    setMode(m);
    setQuery("");
    setBlzResult(null);
    setBicResults([]);
    setBicValidation(null);
  }

  const bicParsed = mode === "bic" && query.length >= 8 ? parseBIC(query) : null;

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["blz", "bic"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-600"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {m === "blz" ? "BLZ → BIC" : "BIC → BLZ"}
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {mode === "blz" ? "Bankleitzahl eingeben" : "BIC / SWIFT-Code eingeben"}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.replace(mode === "blz" ? /\D/g : /\s/g, "").toUpperCase());
              setBlzResult(null);
              setBicResults([]);
              setBicValidation(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={mode === "blz" ? "z.B. 37040044" : "z.B. COBADEFFXXX"}
            maxLength={mode === "blz" ? 8 : 11}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <button
            onClick={handleSearch}
            disabled={!loaded || !query}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loaded ? "Suchen" : "Lade…"}
          </button>
        </div>
        {mode === "bic" && bicParsed && (
          <p className="mt-1.5 text-xs text-zinc-400">
            Bank: <span className="font-mono">{bicParsed.bank}</span> · Land: <span className="font-mono">{bicParsed.country}</span> ({IBAN_COUNTRIES[bicParsed.country]?.label ?? "unbekannt"}) · Standort: <span className="font-mono">{bicParsed.location}</span> · Filiale: <span className="font-mono">{bicParsed.branch}</span>
          </p>
        )}
      </div>

      {/* BIC-Validierung */}
      {mode === "bic" && bicValidation && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${bicValidation.valid
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
        }`}>
          {bicValidation.valid ? "✓ Gültiges BIC-Format" : `✗ ${bicValidation.error}`}
        </div>
      )}

      {/* BLZ-Ergebnis */}
      {mode === "blz" && blzResult && (
        blzResult === "not-found"
          ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
              Keine Bank für BLZ {query} gefunden
            </div>
          : <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <span className="text-xs text-zinc-400">Bank</span>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{blzResult.name}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">Ort</span>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{blzResult.ort}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">BIC / SWIFT</span>
                  <p className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">{blzResult.bic}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">BLZ</span>
                  <p className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">{blzResult.blz}</p>
                </div>
              </div>
            </div>
      )}

      {/* BIC-Ergebnisse */}
      {mode === "bic" && bicValidation?.valid && (
        bicResults.length === 0
          ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
              Keine deutschen Banken für diesen BIC gefunden
            </div>
          : <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {bicResults.length} Treffer
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {bicResults.map((entry) => (
                  <div key={entry.blz} className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{entry.name}</p>
                      <p className="text-xs text-zinc-400">{entry.ort}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-zinc-500">{entry.blz}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      )}
    </div>
  );
}

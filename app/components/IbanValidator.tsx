"use client";

import { useState, useEffect } from "react";
import {
  validateIBAN,
  parseIBAN,
  formatIBAN,
  IBAN_COUNTRIES,
  loadBlzData,
  type BlzEntry,
} from "@/lib/iban";

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">{label}</span>
      <p className={`text-sm text-zinc-800 dark:text-zinc-200 ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

export default function IbanValidator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof validateIBAN> | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parseIBAN> | null>(null);
  const [bankInfo, setBankInfo] = useState<BlzEntry | null>(null);
  const [copied, setCopied] = useState(false);
  const [blzMap, setBlzMap] = useState<Map<string, BlzEntry> | null>(null);

  useEffect(() => {
    loadBlzData()
      .then(({ map }) => setBlzMap(map))
      .catch(() => {}); // silent — bank info simply won't show
  }, []);

  function runCheck(raw: string) {
    const clean = raw.replace(/\s/g, "").toUpperCase();
    if (!clean) { setResult(null); setParsed(null); setBankInfo(null); return; }

    const validation = validateIBAN(clean);
    setResult(validation);

    if (validation.valid) {
      const p = parseIBAN(clean);
      setParsed(p);
      setBankInfo(p?.blz && blzMap ? (blzMap.get(p.blz) ?? null) : null);
    } else {
      setParsed(null);
      setBankInfo(null);
    }
  }

  function handleChange(val: string) {
    const upper = val.toUpperCase();
    setInput(upper);
    setCopied(false);

    const clean = upper.replace(/\s/g, "");
    const country = clean.slice(0, 2);
    const expectedLen = IBAN_COUNTRIES[country]?.length;

    // Auto-check when length matches the expected IBAN length for the country
    if (expectedLen && clean.length === expectedLen) {
      runCheck(clean);
    } else {
      setResult(null);
      setParsed(null);
      setBankInfo(null);
    }
  }

  function handleBlur() {
    const clean = input.replace(/\s/g, "").toUpperCase();
    if (clean.length >= 4) setInput(formatIBAN(clean));
  }

  const cleanIban = input.replace(/\s/g, "").toUpperCase();

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">IBAN eingeben</label>
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && runCheck(input)}
          placeholder="DE89 3704 0044 0532 0130 00"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-400">Wird automatisch geprüft · Auto-Formatierung beim Verlassen des Feldes</p>
      </div>

      {/* Validierungsergebnis */}
      {result && (
        <div className={`rounded-xl border p-4 ${result.valid
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{result.valid ? "✓" : "✗"}</span>
            <span className={`font-semibold ${result.valid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {result.valid ? "IBAN ist gültig" : "IBAN ist ungültig"}
            </span>
          </div>
          {result.error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{result.error}</p>
          )}
        </div>
      )}

      {/* Zerlegung */}
      {parsed && result?.valid && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Zerlegung</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cleanIban).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {copied ? "Kopiert ✓" : "IBAN kopieren"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Land" value={`${parsed.country} – ${parsed.countryLabel}`} />
            <Field label="Prüfziffern" value={parsed.checkDigits} mono />
            <Field label="BBAN" value={parsed.bban} mono />
            {parsed.blz && <Field label="Bankleitzahl" value={parsed.blz} mono />}
            {parsed.konto && <Field label="Kontonummer" value={parsed.konto.replace(/^0+/, "") || "0"} mono />}
          </div>

          <div className="mt-3 rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
            <span className="text-xs text-zinc-400">Formatiert</span>
            <p className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatIBAN(cleanIban)}</p>
          </div>

          {parsed.blz && (
            <div className="mt-3 rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
              <span className="text-xs text-zinc-400">Bank</span>
              {bankInfo
                ? <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{bankInfo.name} · {bankInfo.ort} · BIC: <span className="font-mono">{bankInfo.bic}</span></p>
                : <p className="text-sm text-zinc-400">Keine Bankdaten verfügbar</p>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

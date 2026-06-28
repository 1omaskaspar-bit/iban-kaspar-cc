"use client";

import { useState, useEffect } from "react";
import {
  validateIBAN,
  parseIBAN,
  formatIBAN,
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
    loadBlzData().then(({ map }) => setBlzMap(map));
  }, []);

  function handleCheck() {
    const clean = input.replace(/\s/g, "").toUpperCase();
    if (!clean) return;
    const validation = validateIBAN(clean);
    setResult(validation);
    const p = parseIBAN(clean);
    setParsed(p);
    setBankInfo(null);
    if (validation.valid && p?.blz && blzMap) {
      setBankInfo(blzMap.get(p.blz) ?? null);
    }
  }

  function handleFormatted() {
    const clean = input.replace(/\s/g, "").toUpperCase();
    if (clean.length >= 4) setInput(formatIBAN(clean));
  }

  const cleanIban = input.replace(/\s/g, "").toUpperCase();

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">IBAN eingeben</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setResult(null);
              setParsed(null);
              setBankInfo(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="DE89 3704 0044 0532 0130 00"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <button
            type="button"
            onClick={handleFormatted}
            title="Formatieren"
            className="rounded-lg border border-zinc-200 px-3 py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Format
          </button>
        </div>
      </div>

      <button
        onClick={handleCheck}
        disabled={!cleanIban}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-zinc-900"
      >
        IBAN prüfen
      </button>

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

          {/* IBAN formatiert */}
          <div className="mt-3 rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
            <span className="text-xs text-zinc-400">Formatiert</span>
            <p className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatIBAN(cleanIban)}</p>
          </div>

          {/* Bank-Info für DE */}
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

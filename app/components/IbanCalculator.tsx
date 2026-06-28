"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IBAN_COUNTRIES,
  STRUCTURED_COUNTRIES,
  calculateIBAN,
  formatIBAN,
  loadBlzData,
  type BlzEntry,
} from "@/lib/iban";

const ALL_COUNTRIES = Object.entries(IBAN_COUNTRIES).sort((a, b) =>
  a[1].label.localeCompare(b[1].label, "de")
);

export default function IbanCalculator() {
  const [country, setCountry] = useState("DE");
  const [blz, setBlz] = useState("");
  const [konto, setKonto] = useState("");
  const [bban, setBban] = useState(""); // for non-structured countries
  const [iban, setIban] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bankInfo, setBankInfo] = useState<BlzEntry | null>(null);
  const [blzLoaded, setBlzLoaded] = useState(false);
  const [blzMap, setBlzMap] = useState<Map<string, BlzEntry> | null>(null);

  useEffect(() => {
    loadBlzData().then(({ map }) => {
      setBlzMap(map);
      setBlzLoaded(true);
    });
  }, []);

  const structured = STRUCTURED_COUNTRIES[country];
  const cfg = IBAN_COUNTRIES[country];

  const lookupBlz = useCallback((val: string) => {
    if (country !== "DE" || !blzMap) return;
    const entry = blzMap.get(val);
    setBankInfo(entry ?? null);
  }, [country, blzMap]);

  function handleCountryChange(c: string) {
    setCountry(c);
    setIban(null);
    setError(null);
    setBlz("");
    setKonto("");
    setBban("");
    setBankInfo(null);
  }

  function handleBlzChange(val: string) {
    const clean = val.replace(/\D/g, "");
    setBlz(clean);
    setIban(null);
    setError(null);
    if (clean.length === STRUCTURED_COUNTRIES[country]?.blzLen) {
      lookupBlz(clean);
    } else {
      setBankInfo(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIban(null);
    setCopied(false);

    if (structured) {
      const blzClean = blz.replace(/\s/g, "");
      const kontoClean = konto.replace(/\s/g, "");
      if (!blzClean || !kontoClean) { setError("Bitte alle Felder ausfüllen."); return; }
      if (blzClean.length > structured.blzLen) { setError(`BLZ: max. ${structured.blzLen} Stellen.`); return; }
      if (kontoClean.length > structured.kontoLen) { setError(`Kontonummer: max. ${structured.kontoLen} Stellen.`); return; }
      const bbanStr = blzClean.padStart(structured.blzLen, "0") + kontoClean.padStart(structured.kontoLen, "0");
      setIban(calculateIBAN(country, bbanStr));
    } else {
      const bbanClean = bban.replace(/\s/g, "").toUpperCase();
      const bbanLen = cfg.length - 4;
      if (!bbanClean) { setError("Bitte BBAN eingeben."); return; }
      if (bbanClean.length !== bbanLen) { setError(`BBAN muss genau ${bbanLen} Zeichen haben für ${cfg.label}.`); return; }
      if (!/^[A-Z0-9]+$/.test(bbanClean)) { setError("BBAN: nur Buchstaben und Ziffern."); return; }
      setIban(calculateIBAN(country, bbanClean));
    }
  }

  function handleCopy() {
    if (!iban) return;
    navigator.clipboard.writeText(iban).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Land */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Land</label>
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {ALL_COUNTRIES.map(([code, { label }]) => (
            <option key={code} value={code}>{code} – {label}</option>
          ))}
        </select>
      </div>

      {structured ? (
        <>
          {/* BLZ */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {structured.blzLabel}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={blz}
              onChange={(e) => handleBlzChange(e.target.value)}
              placeholder={"0".repeat(structured.blzLen)}
              maxLength={structured.blzLen}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
            />
            <p className="mt-1 text-xs text-zinc-400">{structured.blzLen} Stellen</p>
            {/* Bank info */}
            {country === "DE" && blz.length === structured.blzLen && (
              <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${bankInfo ? "border border-zinc-100 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50" : "text-zinc-400"}`}>
                {blzLoaded
                  ? bankInfo
                    ? <span className="text-zinc-700 dark:text-zinc-300"><span className="font-medium">{bankInfo.name}</span> · {bankInfo.ort} · BIC: <span className="font-mono">{bankInfo.bic}</span></span>
                    : <span className="text-amber-600 dark:text-amber-500">BLZ nicht gefunden</span>
                  : <span className="text-zinc-400">Lade BLZ-Daten…</span>
                }
              </div>
            )}
          </div>

          {/* Kontonummer */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kontonummer</label>
            <input
              type="text"
              inputMode="numeric"
              value={konto}
              onChange={(e) => { setKonto(e.target.value.replace(/\D/g, "")); setIban(null); setError(null); }}
              placeholder={"0".repeat(structured.kontoLen)}
              maxLength={structured.kontoLen}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
            />
            <p className="mt-1 text-xs text-zinc-400">max. {structured.kontoLen} Stellen</p>
          </div>
        </>
      ) : (
        /* BBAN direkt */
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            BBAN <span className="font-normal text-zinc-400">(Basic Bank Account Number)</span>
          </label>
          <input
            type="text"
            value={bban}
            onChange={(e) => { setBban(e.target.value.toUpperCase()); setIban(null); setError(null); }}
            placeholder={`${cfg.length - 4} Zeichen`}
            maxLength={cfg.length - 4}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
          <p className="mt-1 text-xs text-zinc-400">Genau {cfg.length - 4} Zeichen für {cfg.label}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={structured ? (!blz || !konto) : !bban}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-zinc-900"
      >
        IBAN berechnen
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {iban && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-500">IBAN</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-lg font-semibold tracking-widest text-zinc-900 dark:text-zinc-50 break-all">
              {formatIBAN(iban)}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-green-900/30"
            >
              {copied ? "Kopiert ✓" : "Kopieren"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

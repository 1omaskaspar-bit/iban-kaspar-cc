"use client";

import { useState } from "react";

type Country = "DE" | "AT" | "CH";

const COUNTRY_CONFIG: Record<Country, { label: string; blzLen: number; kontoLen: number; blzLabel: string }> = {
  DE: { label: "Deutschland", blzLen: 8, kontoLen: 10, blzLabel: "Bankleitzahl (BLZ)" },
  AT: { label: "Österreich",  blzLen: 5, kontoLen: 11, blzLabel: "Bankleitzahl (BLZ)" },
  CH: { label: "Schweiz",     blzLen: 5, kontoLen: 12, blzLabel: "Clearing-Nummer (BC)" },
};

function mod97(numStr: string): bigint {
  let remainder = 0n;
  for (const ch of numStr) {
    remainder = (remainder * 10n + BigInt(ch)) % 97n;
  }
  return remainder;
}

function letterToDigits(ch: string): string {
  return (ch.toUpperCase().charCodeAt(0) - 55).toString();
}

function calculateIBAN(country: Country, blz: string, konto: string): string {
  const { blzLen, kontoLen } = COUNTRY_CONFIG[country];
  const bban = blz.padStart(blzLen, "0") + konto.padStart(kontoLen, "0");
  const countryDigits = country.split("").map(letterToDigits).join("");
  const checkInput = bban + countryDigits + "00";
  const remainder = mod97(checkInput);
  const checkDigits = (98n - remainder).toString().padStart(2, "0");
  return country + checkDigits + bban;
}

function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export default function Home() {
  const [country, setCountry] = useState<Country>("DE");
  const [blz, setBlz] = useState("");
  const [konto, setKonto] = useState("");
  const [iban, setIban] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cfg = COUNTRY_CONFIG[country];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIban(null);
    setCopied(false);

    const blzClean = blz.replace(/\s/g, "");
    const kontoClean = konto.replace(/\s/g, "");

    if (!/^\d+$/.test(blzClean) || !/^\d+$/.test(kontoClean)) {
      setError("Bitte nur Ziffern eingeben.");
      return;
    }
    if (blzClean.length > cfg.blzLen) {
      setError(`Die Bankleitzahl darf maximal ${cfg.blzLen} Stellen haben.`);
      return;
    }
    if (kontoClean.length > cfg.kontoLen) {
      setError(`Die Kontonummer darf maximal ${cfg.kontoLen} Stellen haben.`);
      return;
    }

    const result = calculateIBAN(country, blzClean, kontoClean);
    setIban(result);
  }

  function handleCopy() {
    if (!iban) return;
    navigator.clipboard.writeText(iban).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCountryChange(c: Country) {
    setCountry(c);
    setIban(null);
    setError(null);
    setBlz("");
    setKonto("");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            IBAN-Rechner
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Gültige IBAN aus Bankleitzahl und Kontonummer berechnen
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Land */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Land
              </label>
              <div className="flex gap-2">
                {(Object.keys(COUNTRY_CONFIG) as Country[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCountryChange(c)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      country === c
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-600"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{COUNTRY_CONFIG[country].label}</p>
            </div>

            {/* BLZ */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {cfg.blzLabel}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={blz}
                onChange={(e) => { setBlz(e.target.value.replace(/\D/g, "")); setIban(null); setError(null); }}
                placeholder={"0".repeat(cfg.blzLen)}
                maxLength={cfg.blzLen}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
              <p className="mt-1 text-xs text-zinc-400">{cfg.blzLen} Stellen</p>
            </div>

            {/* Kontonummer */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Kontonummer
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={konto}
                onChange={(e) => { setKonto(e.target.value.replace(/\D/g, "")); setIban(null); setError(null); }}
                placeholder={"0".repeat(cfg.kontoLen)}
                maxLength={cfg.kontoLen}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600"
              />
              <p className="mt-1 text-xs text-zinc-400">max. {cfg.kontoLen} Stellen</p>
            </div>

            <button
              type="submit"
              disabled={!blz || !konto}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-zinc-900"
            >
              IBAN berechnen
            </button>
          </form>

          {/* Fehler */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Ergebnis */}
          {iban && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-500">
                Ihre IBAN
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-semibold tracking-widest text-zinc-900 dark:text-zinc-50">
                  {formatIBAN(iban)}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-green-900/30"
                >
                  {copied ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Die Berechnung erfolgt lokal im Browser. Es werden keine Daten übertragen.
        </p>
      </main>
    </div>
  );
}

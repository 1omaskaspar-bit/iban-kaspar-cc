"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const IbanCalculator = dynamic(() => import("@/app/components/IbanCalculator"), { ssr: false });
const IbanValidator  = dynamic(() => import("@/app/components/IbanValidator"),  { ssr: false });
const BicSearch      = dynamic(() => import("@/app/components/BicSearch"),      { ssr: false });

type Tab = "calc" | "validate" | "bic";

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "calc",     label: "IBAN berechnen", desc: "Aus BLZ und Kontonummer" },
  { id: "validate", label: "IBAN prüfen",    desc: "Validieren und zerlegen" },
  { id: "bic",      label: "BIC suchen",     desc: "BLZ ↔ BIC Lookup" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("calc");

  return (
    <div className="flex flex-col flex-1 items-center justify-start min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">IBAN-Rechner</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Berechnen, prüfen und nachschlagen
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className="block">{t.label}</span>
              <span className={`block text-[10px] font-normal ${tab === t.id ? "text-blue-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {tab === "calc"     && <IbanCalculator />}
          {tab === "validate" && <IbanValidator />}
          {tab === "bic"      && <BicSearch />}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Alle Berechnungen erfolgen lokal im Browser. BLZ-Daten: Deutsche Bundesbank.
        </p>
      </main>
    </div>
  );
}

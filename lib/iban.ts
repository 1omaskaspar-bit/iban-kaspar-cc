// IBAN utility functions

export interface BlzEntry {
  blz: string;
  bic: string;
  name: string;
  ort: string;
}

// IBAN lengths and labels for all SWIFT countries
export const IBAN_COUNTRIES: Record<string, { length: number; label: string }> = {
  AD: { length: 24, label: "Andorra" },
  AE: { length: 23, label: "Ver. Arab. Emirate" },
  AL: { length: 28, label: "Albanien" },
  AT: { length: 20, label: "Österreich" },
  AZ: { length: 28, label: "Aserbaidschan" },
  BA: { length: 20, label: "Bosnien-Herzegowina" },
  BE: { length: 16, label: "Belgien" },
  BG: { length: 22, label: "Bulgarien" },
  BH: { length: 22, label: "Bahrain" },
  BR: { length: 29, label: "Brasilien" },
  CH: { length: 21, label: "Schweiz" },
  CR: { length: 22, label: "Costa Rica" },
  CY: { length: 28, label: "Zypern" },
  CZ: { length: 24, label: "Tschechien" },
  DE: { length: 22, label: "Deutschland" },
  DK: { length: 18, label: "Dänemark" },
  DO: { length: 28, label: "Dominikan. Republik" },
  EE: { length: 20, label: "Estland" },
  EG: { length: 29, label: "Ägypten" },
  ES: { length: 24, label: "Spanien" },
  FI: { length: 18, label: "Finnland" },
  FO: { length: 18, label: "Färöer" },
  FR: { length: 27, label: "Frankreich" },
  GB: { length: 22, label: "Vereinigtes Königreich" },
  GE: { length: 22, label: "Georgien" },
  GI: { length: 23, label: "Gibraltar" },
  GL: { length: 18, label: "Grönland" },
  GR: { length: 27, label: "Griechenland" },
  GT: { length: 28, label: "Guatemala" },
  HR: { length: 21, label: "Kroatien" },
  HU: { length: 28, label: "Ungarn" },
  IE: { length: 22, label: "Irland" },
  IL: { length: 23, label: "Israel" },
  IQ: { length: 23, label: "Irak" },
  IS: { length: 26, label: "Island" },
  IT: { length: 27, label: "Italien" },
  JO: { length: 30, label: "Jordanien" },
  KW: { length: 30, label: "Kuwait" },
  KZ: { length: 20, label: "Kasachstan" },
  LB: { length: 28, label: "Libanon" },
  LC: { length: 32, label: "St. Lucia" },
  LI: { length: 21, label: "Liechtenstein" },
  LT: { length: 20, label: "Litauen" },
  LU: { length: 20, label: "Luxemburg" },
  LV: { length: 21, label: "Lettland" },
  LY: { length: 25, label: "Libyen" },
  MC: { length: 27, label: "Monaco" },
  MD: { length: 24, label: "Moldawien" },
  ME: { length: 22, label: "Montenegro" },
  MK: { length: 19, label: "Nordmazedonien" },
  MR: { length: 27, label: "Mauretanien" },
  MT: { length: 31, label: "Malta" },
  MU: { length: 30, label: "Mauritius" },
  NL: { length: 18, label: "Niederlande" },
  NO: { length: 15, label: "Norwegen" },
  PK: { length: 24, label: "Pakistan" },
  PL: { length: 28, label: "Polen" },
  PS: { length: 29, label: "Palästina" },
  PT: { length: 25, label: "Portugal" },
  QA: { length: 29, label: "Katar" },
  RO: { length: 24, label: "Rumänien" },
  RS: { length: 22, label: "Serbien" },
  SA: { length: 24, label: "Saudi-Arabien" },
  SC: { length: 31, label: "Seychellen" },
  SD: { length: 18, label: "Sudan" },
  SE: { length: 24, label: "Schweden" },
  SI: { length: 19, label: "Slowenien" },
  SK: { length: 24, label: "Slowakei" },
  SM: { length: 27, label: "San Marino" },
  ST: { length: 25, label: "São Tomé u. Príncipe" },
  SV: { length: 28, label: "El Salvador" },
  TL: { length: 23, label: "Timor-Leste" },
  TN: { length: 24, label: "Tunesien" },
  TR: { length: 26, label: "Türkei" },
  UA: { length: 29, label: "Ukraine" },
  VA: { length: 22, label: "Vatikanstadt" },
  VG: { length: 24, label: "Brit. Jungferninseln" },
  XK: { length: 20, label: "Kosovo" },
};

// Countries with structured BBAN input (BLZ + Kontonummer)
export const STRUCTURED_COUNTRIES: Record<string, { blzLen: number; kontoLen: number; blzLabel: string }> = {
  DE: { blzLen: 8,  kontoLen: 10, blzLabel: "Bankleitzahl (BLZ)" },
  AT: { blzLen: 5,  kontoLen: 11, blzLabel: "Bankleitzahl (BLZ)" },
  CH: { blzLen: 5,  kontoLen: 12, blzLabel: "Clearing-Nummer (BC)" },
};

function letterToDigits(ch: string): string {
  return (ch.toUpperCase().charCodeAt(0) - 55).toString();
}

function mod97(numStr: string): bigint {
  let remainder = 0n;
  for (const ch of numStr) {
    remainder = (remainder * 10n + BigInt(ch)) % 97n;
  }
  return remainder;
}

export function calculateIBAN(country: string, bban: string): string {
  const countryDigits = country.split("").map(letterToDigits).join("");
  const checkInput = bban + countryDigits + "00";
  const remainder = mod97(checkInput);
  const checkDigits = (98n - remainder).toString().padStart(2, "0");
  return country + checkDigits + bban;
}

export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  const country = clean.slice(0, 2);
  const cfg = IBAN_COUNTRIES[country];

  if (!cfg) return { valid: false, error: `Unbekannter Ländercode: ${country}` };
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return { valid: false, error: "Ungültige Zeichen" };
  if (clean.length !== cfg.length) return { valid: false, error: `Falsche Länge: ${clean.length} statt ${cfg.length} Zeichen für ${cfg.label}` };

  // Rearrange: BBAN + country + check digits, letters → numbers
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numStr = rearranged.split("").map(c => /[A-Z]/.test(c) ? letterToDigits(c) : c).join("");
  const rem = mod97(numStr);

  if (rem !== 1n) return { valid: false, error: "Prüfziffer ungültig (mod97 ≠ 1)" };
  return { valid: true };
}

export function parseIBAN(iban: string): {
  country: string;
  countryLabel: string;
  checkDigits: string;
  bban: string;
  blz?: string;
  konto?: string;
} | null {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  if (clean.length < 4) return null;
  const country = clean.slice(0, 2);
  const checkDigits = clean.slice(2, 4);
  const bban = clean.slice(4);
  const cfg = IBAN_COUNTRIES[country];
  if (!cfg) return null;

  const result: ReturnType<typeof parseIBAN> = {
    country,
    countryLabel: cfg.label,
    checkDigits,
    bban,
  };

  // Structured decomposition for known countries
  const structured = STRUCTURED_COUNTRIES[country];
  if (structured) {
    result!.blz = bban.slice(0, structured.blzLen);
    result!.konto = bban.slice(structured.blzLen);
  }

  return result;
}

export function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function validateBIC(bic: string): { valid: boolean; error?: string } {
  const clean = bic.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
    return { valid: false, error: "Ungültiges BIC-Format (erwartet: AAAA BB CC [DDD])" };
  }
  return { valid: true };
}

export function parseBIC(bic: string): { bank: string; country: string; location: string; branch: string } {
  const clean = bic.replace(/\s/g, "").toUpperCase().padEnd(11, "X");
  return {
    bank: clean.slice(0, 4),
    country: clean.slice(4, 6),
    location: clean.slice(6, 8),
    branch: clean.slice(8, 11) === "XXX" ? "(Hauptstelle)" : clean.slice(8, 11),
  };
}

// BLZ data loader (singleton, lazy)
let blzCache: BlzEntry[] | null = null;
let blzMap: Map<string, BlzEntry> | null = null;

export async function loadBlzData(): Promise<{ list: BlzEntry[]; map: Map<string, BlzEntry> }> {
  if (blzCache && blzMap) return { list: blzCache, map: blzMap };
  const res = await fetch("/blz-data.json");
  blzCache = await res.json();
  blzMap = new Map(blzCache!.map(e => [e.blz, e]));
  return { list: blzCache!, map: blzMap };
}

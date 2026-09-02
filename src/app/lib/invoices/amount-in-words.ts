// src/app/lib/invoices/amount-in-words.ts
// Conversion d'un montant en toutes lettres en français, adaptée aux factures
// MD2I (devise Ariary). Pas de dépendance externe : le format exact requis
// ("... ariary et ... y compris les taxes sur les marchés publics (TMP) de
// X% ") est trop spécifique pour une librairie générique de conversion.

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
]

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix',
]

/** Convertit un nombre de 0 à 99 en lettres (règles françaises traditionnelles). */
function twoDigitsToWords(n: number): string {
  if (n < 20) return UNITS[n]

  const tensDigit = Math.floor(n / 10)
  const unit = n % 10

  // 70-79 et 90-99 se construisent sur soixante-dix / quatre-vingt-dix + 0-19
  if (tensDigit === 7 || tensDigit === 9) {
    const base = TENS[tensDigit - 1]
    return unit === 0 ? base : `${base}-${UNITS[10 + unit]}`
  }

  if (unit === 0) {
    // "quatre-vingts" prend un s au pluriel exact, pas les autres dizaines
    return tensDigit === 8 ? `${TENS[tensDigit]}s` : TENS[tensDigit]
  }

  if (unit === 1 && tensDigit !== 8) {
    return `${TENS[tensDigit]} et un`
  }

  return `${TENS[tensDigit]}-${UNITS[unit]}`
}

/** Convertit un nombre de 0 à 999 en lettres. */
function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100

  if (hundreds === 0) return twoDigitsToWords(rest)

  const hundredWord = hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`
  // "cents" prend un s uniquement si multiple exact de 100 (et > 1)
  const hundredWordFinal = rest === 0 && hundreds > 1 ? `${hundredWord}s` : hundredWord

  return rest === 0 ? hundredWordFinal : `${hundredWordFinal} ${twoDigitsToWords(rest)}`
}

const SCALES: Array<{ value: number; singular: string; plural: string }> = [
  { value: 1_000_000_000, singular: 'milliard', plural: 'milliards' },
  { value: 1_000_000, singular: 'million', plural: 'millions' },
  { value: 1_000, singular: 'mille', plural: 'mille' },
]

/** Convertit un entier positif (0 à ~999 milliards) en toutes lettres françaises. */
export function integerToFrenchWords(value: number): string {
  const n = Math.floor(Math.abs(value))

  if (n === 0) return 'zéro'

  const parts: string[] = []
  let remainder = n

  for (const scale of SCALES) {
    const count = Math.floor(remainder / scale.value)

    if (count > 0) {
      if (scale.value === 1_000) {
        // "mille" est invariable et ne prend jamais "un" devant
        parts.push(count === 1 ? 'mille' : `${threeDigitsToWords(count)} mille`)
      } else {
        const word = count === 1 ? scale.singular : scale.plural
        parts.push(`${threeDigitsToWords(count)} ${word}`)
      }

      remainder -= count * scale.value
    }
  }

  if (remainder > 0 || parts.length === 0) {
    parts.push(threeDigitsToWords(remainder))
  }

  return parts.join(' ').trim()
}

/**
 * Génère le texte "montant en lettres" tel qu'affiché sur les factures MD2I :
 * "{partie entière en lettres} ariary et {centimes en lettres} y compris les
 * {taxLabel} de {tmpRatePercent}% "
 *
 * Si les centimes sont nuls, la mention "et ..." est omise. `taxLabel` est le
 * texte complet de la mention fiscale ("taxes sur les marchés publics (TMP)"
 * par défaut), fourni tel quel par facture — certains contrats utilisent une
 * autre taxe (TTC, TPC...) avec un intitulé différent.
 */
export function invoiceAmountInWords(
  totalTtc: number,
  tmpRatePercent: number,
  taxLabel = 'taxes sur les marchés publics (TMP)'
): string {
  const rounded = Math.round(Math.abs(totalTtc) * 100) / 100
  const integerPart = Math.floor(rounded)
  const cents = Math.round((rounded - integerPart) * 100)

  const integerWords = integerToFrenchWords(integerPart)
  const centsClause = cents > 0 ? ` et ${integerToFrenchWords(cents)} centimes` : ''

  const rateLabel = Number.isInteger(tmpRatePercent)
    ? String(tmpRatePercent)
    : String(tmpRatePercent).replace('.', ',')

  return `${integerWords} ariary${centsClause} y compris les ${taxLabel} de ${rateLabel}%`
}

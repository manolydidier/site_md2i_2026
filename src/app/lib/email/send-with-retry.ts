// Enveloppe resend.emails.send(...) avec quelques tentatives en cas d'échec
// transitoire (réseau, rate limit, erreur 5xx côté Resend). Ne retente jamais
// une erreur permanente (email invalide, domaine non vérifié, etc.) — inutile
// de réessayer une adresse qui ne sera jamais valide.
//
// Conserve exactement la forme de retour {data, error} que resend.emails.send
// renvoie déjà, pour que le code appelant n'ait rien à changer côté gestion
// d'erreur.

import type { Resend } from "resend";

type ResendSendParams = Parameters<Resend["emails"]["send"]>[0];
type ResendSendResult = Awaited<ReturnType<Resend["emails"]["send"]>>;

const DEFAULT_RETRIES = 2; // → jusqu'à 3 tentatives au total
const BASE_DELAY_MS = 400;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableResendError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const name = "name" in error ? String((error as { name?: unknown }).name) : "";
  const statusCode =
    "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : undefined;

  if (name === "rate_limit_exceeded" || name === "internal_server_error") return true;
  if (typeof statusCode === "number" && statusCode >= 500) return true;

  return false;
}

export async function sendResendEmail(
  client: Resend,
  payload: ResendSendParams,
  opts?: { retries?: number }
): Promise<ResendSendResult> {
  const maxRetries = opts?.retries ?? DEFAULT_RETRIES;
  let lastResult: ResendSendResult | undefined;
  let lastThrown: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await client.emails.send(payload);

      if (!result.error || !isRetryableResendError(result.error)) {
        return result;
      }

      lastResult = result;
    } catch (error) {
      // Erreur réseau/exception — toujours retentée.
      lastThrown = error;
    }

    if (attempt < maxRetries) {
      await wait(BASE_DELAY_MS * 2 ** attempt);
    }
  }

  if (lastResult) return lastResult;
  throw lastThrown;
}

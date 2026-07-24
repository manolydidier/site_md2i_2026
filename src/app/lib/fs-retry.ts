// Erreurs filesystem transitoires (verrou, trop de descripteurs ouverts…) —
// celles qui valent la peine d'être retentées, contrairement à ENOSPC/EACCES
// qui ne se résoudront pas tout seuls entre deux tentatives.
const TRANSIENT_ERROR_CODES = new Set(["EBUSY", "EMFILE", "ENFILE", "EAGAIN"]);

function isTransientFsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    TRANSIENT_ERROR_CODES.has(String((error as { code: unknown }).code))
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withFsRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 150;

  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isTransientFsError(error) || attempt === retries - 1) {
        throw error;
      }

      await delay(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}

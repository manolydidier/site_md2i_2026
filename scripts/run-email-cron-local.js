// scripts/run-email-cron-local.js

const CRON_SECRET = process.env.CRON_SECRET || "md2i";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function runCron() {
  const startedAt = new Date();

  try {
    const url = `${BASE_URL}/api/cron/send-automation-emails?secret=${encodeURIComponent(
      CRON_SECRET
    )}`;

    console.log("[local-email-cron][RUN_START]", {
      url,
      startedAt: startedAt.toISOString(),
    });

    const res = await fetch(url);
    const data = await res.json();

    console.log("[local-email-cron][RUN_RESULT]", {
      status: res.status,
      data,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[local-email-cron][RUN_ERROR]", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Lance une fois au démarrage.
runCron();

// Puis relance toutes les 30 secondes.
// Comme ça, un délai de 1 ou 2 minutes sera bien traité.
setInterval(runCron, 30_000);
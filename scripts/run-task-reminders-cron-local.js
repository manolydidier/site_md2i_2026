// scripts/run-task-reminders-cron-local.js

const CRON_SECRET = process.env.CRON_SECRET || "md2i";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function runCron() {
  const startedAt = new Date();

  try {
    const url = `${BASE_URL}/api/cron/send-task-reminders?secret=${encodeURIComponent(
      CRON_SECRET
    )}`;

    console.log("[local-task-reminders-cron][RUN_START]", {
      url,
      startedAt: startedAt.toISOString(),
    });

    const res = await fetch(url);
    const data = await res.json();

    console.log("[local-task-reminders-cron][RUN_RESULT]", {
      status: res.status,
      data,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[local-task-reminders-cron][RUN_ERROR]", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Lance une fois au démarrage.
runCron();

// Puis relance toutes les 30 secondes.
setInterval(runCron, 30_000);

/**
 * Local/production worker entry point for idempotent loyalty jobs.
 * A scheduler may invoke the same service methods; JobRun prevents duplicate
 * work when more than one worker is started.
 */

import { prisma } from "@/db/prisma";
import { evaluationService } from "@/services/evaluation.service";

const intervalMs = Number(process.env.JOB_INTERVAL_MS ?? 900_000);

async function runOnce(): Promise<void> {
  await evaluationService.runMonthlyMembershipEvaluation();
  await evaluationService.runTokenExpiryJob();
  await evaluationService.runTokenExpiryReminderJob();
}

async function start(): Promise<void> {
  if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
    throw new Error("JOB_INTERVAL_MS must be at least 60000 milliseconds");
  }

  await runOnce();
  const timer = setInterval(() => {
    void runOnce().catch((error: unknown) => {
      console.error("[Worker] Scheduled loyalty job failed", error instanceof Error ? error.message : "unknown error");
    });
  }, intervalMs);

  const shutdown = (): void => {
    clearInterval(timer);
    void prisma.$disconnect().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void start().catch((error: unknown) => {
  console.error("[Worker] Startup failed", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});

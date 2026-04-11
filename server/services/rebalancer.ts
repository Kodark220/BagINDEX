import cron from "node-cron";
import { fullRefresh } from "./index-manager";

let isRunning = false;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Start the automated rebalancing agent.
 * Runs a full data refresh + index rebuild on a schedule.
 */
export function startRebalancer(): void {
  console.log("🤖 Rebalancer agent starting...");

  // Initial run
  runRebalance();

  // Schedule: every 5 minutes
  cronJob = cron.schedule("*/5 * * * *", () => {
    runRebalance();
  });

  console.log("⏰ Rebalancer scheduled: every 5 minutes");
}

async function runRebalance(): Promise<void> {
  if (isRunning) {
    console.log("⏳ Rebalance already in progress, skipping...");
    return;
  }

  isRunning = true;
  try {
    console.log("🔄 Running rebalance cycle...");
    await fullRefresh();
    console.log("✅ Rebalance complete");
  } catch (err) {
    console.error("❌ Rebalance failed:", err);
  } finally {
    isRunning = false;
  }
}

export function stopRebalancer(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("🛑 Rebalancer stopped");
  }
}

/** Trigger an immediate rebalance (for manual/API use) */
export async function triggerRebalance(): Promise<void> {
  await runRebalance();
}

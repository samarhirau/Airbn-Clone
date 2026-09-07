import cron, { type ScheduledTask } from 'node-cron';
import { logger } from '../config/logger';
import { markCompletedBookings } from './markCompletedBookings';

let tasks: ScheduledTask[] = [];

/**
 * Start background jobs. Safe to run on every instance (the work is idempotent).
 */
export function startJobs(): void {
  // Run shortly after boot so freshly-restarted instances converge quickly
  markCompletedBookings().catch((err) => logger.error({ err }, 'markCompletedBookings (startup) failed'));

  // Then hourly at minute 0
  const task = cron.schedule('0 * * * *', () => {
    markCompletedBookings().catch((err) => logger.error({ err }, 'markCompletedBookings (cron) failed'));
  });
  tasks.push(task);
  logger.info('Background jobs scheduled');
}

export function stopJobs(): void {
  tasks.forEach((t) => t.stop());
  tasks = [];
}

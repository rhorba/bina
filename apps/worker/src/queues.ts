export const QUEUES = {
  SCRAPER_DAILY: "scraper.daily",
  ALERT_SWEEP: "alert.sweep",
  DEADLINE_REMINDER: "deadline.reminder",
  DOC_EXPIRY_SWEEP: "doc.expiry.sweep",
  GROUPEMENT_ARCHIVE: "groupement.archive",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const CRON_SCHEDULES = {
  [QUEUES.SCRAPER_DAILY]: "0 6 * * *", // daily at 6am
  [QUEUES.ALERT_SWEEP]: "0 7 * * *", // daily at 7am (after scrape)
  [QUEUES.DEADLINE_REMINDER]: "30 7 * * *", // daily at 7:30am
  [QUEUES.DOC_EXPIRY_SWEEP]: "0 8 * * *", // daily at 8am
  [QUEUES.GROUPEMENT_ARCHIVE]: "0 2 * * 0", // weekly Sunday at 2am
} as const;

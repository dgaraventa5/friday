import logger from './logger';

export function trackEvent(event: string, data: Record<string, unknown> = {}) {
  // Placeholder analytics implementation
  logger.log('[analytics]', event, data);
}

import {createLogger} from 'vite';
import pc from 'picocolors';

export const logger = createLogger('info', {
  prefix: pc.greenBright('[pastoria]'),
});

export function logInfo(...messages: string[]) {
  logger.info(messages.join(' '), {timestamp: true});
}

export function logWarn(...messages: string[]) {
  logger.warn(messages.join(' '), {timestamp: true});
}

export function logError(...messages: string[]) {
  logger.error(messages.join(' '), {timestamp: true});
}

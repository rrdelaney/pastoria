import {createLogger} from 'vite';
import pc from 'picocolors';

export const logger = createLogger('info', {prefix: pc.greenBright('[MAKE]')});

export function logInfo(...messages: string[]) {
  logger.info(messages.join(' '), {timestamp: true});
}

export function logWarn(...messages: string[]) {
  logger.warn(messages.join(' '), {timestamp: true});
}

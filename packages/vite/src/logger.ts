import {createLogger} from 'vite';
import pc from 'picocolors';

export const logger = createLogger('info', {
  prefix: pc.greenBright('[pastoria]'),
});

export function logInfo(...messages: string[]) {
  logger.info(messages.join(' '), {timestamp: true});
}

export const warnLogger = createLogger('warn', {
  prefix: pc.yellow('[! warn !]'),
});

export function logWarn(...messages: string[]) {
  warnLogger.warn(messages.join(' '), {timestamp: true});
}

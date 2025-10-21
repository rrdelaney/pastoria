import pc from 'picocolors';
import type {Logger as ViteLogger} from 'vite';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface LoggerOptions {
  /**
   * Namespace for the logger (e.g., "pastoria:generate")
   */
  namespace?: string;

  /**
   * Minimum log level to output
   * @default "info"
   */
  level?: LogLevel;

  /**
   * Whether to include timestamps
   * @default false
   */
  timestamps?: boolean;

  /**
   * Whether to disable colors (useful for CI/logs)
   * @default false
   */
  noColor?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function formatTimestamp(): string {
  const now = new Date();
  return pc.gray(
    `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`,
  );
}

function createLogger(options: LoggerOptions = {}): Logger {
  const {
    namespace,
    level = 'info',
    timestamps = false,
    noColor = false,
  } = options;

  const minLevel = LOG_LEVELS[level];

  function formatMessage(
    level: LogLevel,
    message: string,
    ...args: unknown[]
  ): string {
    const parts: string[] = [];

    if (timestamps) {
      parts.push(formatTimestamp());
    }

    if (namespace) {
      parts.push(noColor ? `[${namespace}]` : pc.cyan(`[${namespace}]`));
    }

    // Format log level with color
    let levelPrefix = '';
    switch (level) {
      case 'debug':
        levelPrefix = noColor ? '[DEBUG]' : pc.gray('[DEBUG]');
        break;
      case 'info':
        levelPrefix = noColor ? '[INFO]' : pc.blue('[INFO]');
        break;
      case 'warn':
        levelPrefix = noColor ? '[WARN]' : pc.yellow('[WARN]');
        break;
      case 'error':
        levelPrefix = noColor ? '[ERROR]' : pc.red('[ERROR]');
        break;
    }
    parts.push(levelPrefix);

    parts.push(message);

    let result = parts.join(' ');

    // Append additional arguments if any
    if (args.length > 0) {
      const formattedArgs = args
        .map((arg) => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
          }
          return String(arg);
        })
        .join(' ');
      result += ' ' + formattedArgs;
    }

    return result;
  }

  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= minLevel;
  }

  return {
    debug(message: string, ...args: unknown[]) {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', message, ...args));
      }
    },
    info(message: string, ...args: unknown[]) {
      if (shouldLog('info')) {
        console.log(formatMessage('info', message, ...args));
      }
    },
    warn(message: string, ...args: unknown[]) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, ...args));
      }
    },
    error(message: string, ...args: unknown[]) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, ...args));
      }
    },
  };
}

/**
 * Create a Vite-compatible logger that uses the Pastoria logger internally
 */
export function createViteLogger(options: LoggerOptions = {}): ViteLogger {
  const logger = createLogger(options);
  const warnedMessages = new Set<string>();

  return {
    info(msg: string) {
      logger.info(msg);
    },
    warn(msg: string) {
      logger.warn(msg);
    },
    warnOnce(msg: string) {
      if (!warnedMessages.has(msg)) {
        warnedMessages.add(msg);
        logger.warn(msg);
      }
    },
    error(msg: string) {
      logger.error(msg);
    },
    clearScreen() {
      // No-op for now, could be implemented if needed
    },
    hasErrorLogged() {
      return false;
    },
    hasWarned: false,
  };
}

/**
 * Get a logger instance with the given namespace
 */
export function getLogger(namespace?: string, options?: LoggerOptions): Logger {
  return createLogger({
    ...options,
    namespace,
  });
}

/**
 * Default logger instance for quick usage
 */
export const logger = createLogger({namespace: 'pastoria'});

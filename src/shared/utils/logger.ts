type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

interface LogContext {
  route?: string;
  method?: string;
  ip?: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

function formatLog(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const base = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (!context || Object.keys(context).length === 0) return base;
  return `${base} ${JSON.stringify(context)}`;
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (shouldLog('debug')) console.debug(formatLog('debug', message, context));
  },
  info: (message: string, context?: LogContext) => {
    if (shouldLog('info')) console.info(formatLog('info', message, context));
  },
  warn: (message: string, context?: LogContext) => {
    if (shouldLog('warn')) console.warn(formatLog('warn', message, context));
  },
  error: (message: string, context?: LogContext) => {
    if (shouldLog('error')) console.error(formatLog('error', message, context));
  },
};

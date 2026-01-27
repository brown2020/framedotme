type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enableInProduction: boolean;
  minLevel: LogLevel;
}

const defaultConfig: LoggerConfig = {
  enableInProduction: false,
  minLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
};

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === "production" && !this.config.enableInProduction) {
      return level === "error" || level === "warn";
    }
    return levels[level] >= levels[this.config.minLevel];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

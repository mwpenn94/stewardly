/**
 * Logger shim for ported Stewardly v3 integration sources. Manus-next uses
 * raw `console.*` calls; Stewardly used a thin `logger` wrapper. Re-exporting
 * a console-backed logger keeps the imports in censusApiClient / financialData
 * adapters working without rewriting their bodies.
 */
function format(prefix: string, args: unknown[]): unknown[] {
  return [`[${prefix}]`, ...args];
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

function createLogger(prefix = "app"): Logger {
  return {
    debug: (...args: unknown[]) => console.debug(...format(`${prefix}:debug`, args)),
    info: (...args: unknown[]) => console.info(...format(`${prefix}:info`, args)),
    warn: (...args: unknown[]) => console.warn(...format(`${prefix}:warn`, args)),
    error: (...args: unknown[]) => console.error(...format(`${prefix}:error`, args)),
    child: (bindings: Record<string, unknown>) => {
      const ns = (bindings.namespace as string) || (bindings.module as string) || prefix;
      return createLogger(ns);
    },
  };
}

export const logger: Logger = createLogger();

export default logger;

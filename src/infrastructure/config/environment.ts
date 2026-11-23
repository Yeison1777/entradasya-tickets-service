export interface EnvironmentVariables {
  PORT: number;
  WEB_ORIGIN: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  INTERNAL_API_KEY: string;
  AUTH_SERVICE_URL: string;
  EVENTS_SERVICE_URL: string;
  TICKETS_STORAGE_PATH: string;
  HTTP_TIMEOUT_MS: number;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = {
    PORT: readNumber(config.PORT, 3005),
    WEB_ORIGIN: readString(config.WEB_ORIGIN, 'http://localhost:5173'),
    DATABASE_URL: readString(config.DATABASE_URL),
    JWT_SECRET: readString(config.JWT_SECRET),
    INTERNAL_API_KEY: readString(config.INTERNAL_API_KEY),
    AUTH_SERVICE_URL: readString(
      config.AUTH_SERVICE_URL,
      'http://localhost:3001',
    ),
    EVENTS_SERVICE_URL: readString(
      config.EVENTS_SERVICE_URL,
      'http://localhost:3002',
    ),
    TICKETS_STORAGE_PATH: readString(
      config.TICKETS_STORAGE_PATH,
      '../../storage/tickets',
    ),
    HTTP_TIMEOUT_MS: readNumber(config.HTTP_TIMEOUT_MS, 3000),
  };
  if (!result.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL debe ser una URL válida de PostgreSQL.');
  }
  if (result.JWT_SECRET.length < 24 || result.INTERNAL_API_KEY.length < 24) {
    throw new Error(
      'JWT_SECRET e INTERNAL_API_KEY deben tener al menos 24 caracteres.',
    );
  }
  if (
    !URL.canParse(result.AUTH_SERVICE_URL) ||
    !URL.canParse(result.EVENTS_SERVICE_URL)
  ) {
    throw new Error('Las URL internas deben ser válidas.');
  }
  return result;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'string' || typeof value === 'number'
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

export function getAllowedOrigins(configuredOrigins?: string): string[] {
  return (configuredOrigins ?? DEFAULT_CORS_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

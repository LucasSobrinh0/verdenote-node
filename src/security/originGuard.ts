import { env } from '../config/env';

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) {
    return true;
  }
  return env.corsOrigin.split(',').map((item) => item.trim()).includes(origin);
}

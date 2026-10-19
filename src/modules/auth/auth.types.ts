import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  permissions: string[];
  roles: { key: string; name: string }[];
  mustChangePassword: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
}

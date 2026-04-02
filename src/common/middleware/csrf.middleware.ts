import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'x-xsrf-token';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate CSRF token if not present in cookies
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = randomBytes(32).toString('hex');
      const isProd = process.env['NODE_ENV'] === 'production';
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });
    }

    // Validate CSRF token on state-changing requests
    if (STATE_CHANGING_METHODS.includes(req.method)) {
      const cookieToken = req.cookies?.[CSRF_COOKIE];
      const headerToken = req.headers[CSRF_HEADER] as string;

      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        throw new ForbiddenException('Token CSRF invalido o ausente');
      }
    }

    next();
  }
}

import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorator.js';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      service: 'reyansha-api',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  private start = Date.now();

  @Get('health')
  health() {
    return { status: 'ok', uptime: (Date.now() - this.start) / 1000 };
  }

  @Get('ready')
  ready() {
    // In a real app, check DB/Redis readiness.
    return { status: 'ready' };
  }
}

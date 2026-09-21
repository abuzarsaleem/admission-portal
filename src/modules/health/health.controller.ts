import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'admission-portal' },
            feature: { type: 'string', example: 'ADM-F000' },
            timestamp: { type: 'string', example: '2026-09-18T13:00:00.000Z' },
          },
        },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'admission-portal',
      feature: 'ADM-F000',
      timestamp: new Date().toISOString(),
    };
  }
}

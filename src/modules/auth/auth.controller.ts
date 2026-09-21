import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiStandardErrorResponses,
  ApiWrappedCreatedResponse,
} from '../../common/decorators/api-docs.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-response.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto, LoginResponseDto } from './dto/login.dto.js';

@ApiTags('Auth')
@ApiExtraModels(LoginDto, LoginResponseDto, ApiErrorResponseDto)
@ApiStandardErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Login via Base Platform IAM',
    description:
      'Password login against IAM, then silent OAuth consent for the registered ' +
      'admission-portal client. Returns an OAuth JWT (`type=oauth`) for Bearer auth.',
  })
  @ApiWrappedCreatedResponse(LoginResponseDto, 'Login successful')
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.login(dto.email, dto.password);
    return {
      access_token: result.accessToken,
      user_id: result.userId,
      tenant_id: result.tenantId,
      email: result.email,
      roles: result.roles,
    };
  }
}

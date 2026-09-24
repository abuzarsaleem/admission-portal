import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const storageDriver = (
    process.env.STORAGE_DRIVER ?? 'local'
  ).toLowerCase();
  if (!['s3', 'minio', 'b2', 'backblaze'].includes(storageDriver)) {
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/media/',
    });
  }

  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) => {
          if (error.constraints) {
            return Object.values(error.constraints);
          }
          return (error.children ?? []).flatMap((child) =>
            child.constraints ? Object.values(child.constraints) : [],
          );
        });
        return new BadRequestException({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: messages.length > 0 ? messages : ['Validation failed'],
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Admission Portal API')
    .setDescription(
      'ADM-F000 Admissions Intake & Offering Management APIs. ' +
        'Admin endpoints require `Authorization: Bearer <OAuth access token>` from `POST /auth/login`. ' +
        'Tenant is always `DEFAULT_TENANT_ID`; user id comes from the JWT `sub` claim. ' +
        'Applicant read endpoints are public (published data for DEFAULT_TENANT_ID).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addTag('Auth', 'IAM login bridge (password → OAuth JWT)')
    .addTag('Intake', 'Intake session configuration and application windows')
    .addTag('Programme Offering', 'Programme offerings within an intake')
    .addTag('Admission Criteria', 'Applicant-facing admission criteria on offerings')
    .addTag('Fee Configuration', 'Offering fee configuration')
    .addTag('Supporting Information', 'Applicant-facing supporting information on offerings')
    .addTag('General Criteria', 'Reusable admission criteria master records')
    .addTag('General Fees', 'Reusable programme fee master records')
    .addTag('General Declarations', 'Reusable institution-wide declaration masters')
    .addTag('Offering Declarations', 'Offering-specific declaration configuration')
    .addTag('Intake Review & Publication', 'Submit, review, publish, return, and close intakes')
    .addTag('Applicant Admissions', 'Public published intake/offering reads and application handoff')
    .addTag('Applicant Registration', 'Applicant registration, verification, and password setup')
    .addTag('Applicants Applications', 'Application completion steps, uploads, and submission')
    .addTag('Departments', 'Academic department master data')
    .addTag('Programmes', 'Programme master data')
    .addTag('Criteria Types', 'Criteria-type catalogue')
    .addTag('Fee Types', 'Fee-type catalogue')
    .addTag('Declaration Types', 'Declaration-type catalogue')
    .addTag('Health', 'Service health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Keep DocumentBuilder tag order — do not set tagsSorter (functions cannot be
  // serialized into the Swagger UI HTML config and crash the page as null).
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: {
      persistAuthorization: true,
      operationsSorter: 'alpha',
    },
  });

  const port = config.get<number>('port', 3000);
  await app.listen(port);
}

await bootstrap();

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Use NestJS structured logger for all framework-level messages
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS — reads FRONTEND_URL from env; falls back to localhost for local dev
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe — strip unknown fields, reject badly-shaped bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:           true,   // strip extra fields
      forbidNonWhitelisted: true,  // reject requests with unknown fields
      transform:           true,   // auto-transform to DTO types
      transformOptions:    { enableImplicitConversion: true },
    }),
  );

  // Global interceptor — logs every request with method, path, status, duration
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter — structured JSON errors + server-side logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger / OpenAPI — only in non-production environments
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Planwell Accounting API')
      .setDescription(
        'REST API for the Planwell Insurance Brokerage accounting dashboard.\n\n' +
        'All transactional endpoints require a Bearer token from `POST /api/v1/auth/signin`.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth')
      .addTag('Journal Entries')
      .addTag('Imprest Cash Book')
      .addTag('Production (Commission by Insurer)')
      .addTag('Accounts Receivable')
      .addTag('Bank Transactions')
      .addTag('Trial Balance')
      .addTag('Financials (Read-only computed data)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log('Swagger docs → http://localhost:' + (process.env.PORT ?? '4000') + '/api/docs');
  }

  const port = parseInt(process.env.PORT ?? '4000', 10);
  await app.listen(port);

  logger.log(`Planwell API running on port ${port}  [${process.env.NODE_ENV ?? 'development'}]`);
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();

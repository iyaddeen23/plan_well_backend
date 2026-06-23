import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Build allowed-origins list.
  // FRONTEND_URL can be a single URL or comma-separated list:
  //   FRONTEND_URL=https://planwell.vercel.app,https://other.vercel.app
  const explicitOrigins: string[] = ['http://localhost:3000', 'http://localhost:3001'];
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach(u => {
      const trimmed = u.trim();
      if (trimmed) explicitOrigins.push(trimmed);
    });
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);                                        // server-to-server / curl
      if (explicitOrigins.includes(origin)) return callback(null, true);              // explicit allow-list
      if (/^https:\/\/[^.]+\.vercel\.app$/.test(origin)) return callback(null, true); // any Vercel preview
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions:     { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Magebooks Accounting API')
      .setDescription(
        'REST API for the Magebooks Accounting Software dashboard.\n\n' +
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

  logger.log(`Magebooks Accounting API running  port=${port}  env=${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`CORS: ${explicitOrigins.join(', ')} + *.vercel.app`);
}

bootstrap();

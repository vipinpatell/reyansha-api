import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule, ObserveInstrument } from './app.module.js';
import { getAllowedOrigins } from './modules/auth/origins.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const allowedOrigins = getAllowedOrigins(process.env.CORS_ORIGINS);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Bootstrap-Token'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  const config = new DocumentBuilder()
    .setTitle('Reyansha API')
    .setDescription(
      'Reyansha API v1: authentication, session management, user profiles, role-based access control, and health endpoints.',
    )
    .setVersion('1.0')
    .addCookieAuth('reyansha_session', {
      type: 'apiKey',
      in: 'cookie',
      description: 'HttpOnly session cookie returned by /auth/login',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Reyansha API v1 - Swagger',
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`API root: http://localhost:${port}/`);
  console.log(`API v1: http://localhost:${port}/api/v1/`);
  console.log(`Users API: http://localhost:${port}/api/v1/users`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

await bootstrap();

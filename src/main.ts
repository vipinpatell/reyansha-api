
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  const config = new DocumentBuilder()
    .setTitle('Reyansha API')
    .setDescription('REST API documentation for Reyansha Ecosystem')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`API root: http://localhost:${port}/`);
  console.log(`API v1: http://localhost:${port}/api/v1/`);
  console.log(`Users API: http://localhost:${port}/api/v1/users`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

await bootstrap();

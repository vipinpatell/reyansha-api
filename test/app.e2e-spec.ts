import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/'] });
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
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
        .build(),
    );
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'Reyansha API v1 - Swagger',
    });
    await app.init();
  });

  it('/ (GET) remains public', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('<h1>Reyansha API</h1>');
      });
  });

  it('/users (GET) requires authentication', () => {
    return request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('/health (GET) remains public', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('/api/v1/info (GET) lists the current API modules', () => {
    return request(app.getHttpServer())
      .get('/api/v1/info')
      .expect(200)
      .expect(({ body }) => {
        expect(body.apis.map(({ api }: { api: string }) => api)).toEqual(
          expect.arrayContaining([
            'Authentication',
            'Users',
            'Roles',
            'Health',
          ]),
        );
      });
  });

  it('/docs-json (GET) includes auth and role operations', () => {
    return request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect(({ body }) => {
        expect(body.info.title).toBe('Reyansha API');
        expect(body.paths).toHaveProperty('/api/v1/auth/login');
        expect(body.paths).toHaveProperty('/api/v1/roles');
        expect(body.paths).toHaveProperty('/api/v1/users/{id}/roles');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

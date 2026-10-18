import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service.js';

describe('AppService', () => {
  async function createService(connection: {
    readyState: number;
    host: string;
    port: number;
    name: string;
  }) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: connection,
        },
      ],
    }).compile();

    return module.get(AppService);
  }

  it('shows the documentation link and connected MongoDB details', async () => {
    const service = await createService({
      readyState: 1,
      host: '127.0.0.1',
      port: 27017,
      name: 'reyansha_db',
    });

    const page = service.getHomePage();

    expect(page).toContain(
      `<a href="/docs">http://localhost:${process.env.PORT ?? '3000'}/docs</a>`,
    );
    expect(page).toContain('<dd class="status">Connected</dd>');
    expect(page).toContain('<dd>127.0.0.1</dd>');
    expect(page).toContain('<dd>27017</dd>');
    expect(page).toContain('<dd>reyansha_db</dd>');
  });

  it('shows disconnected when MongoDB is not connected', async () => {
    const service = await createService({
      readyState: 0,
      host: '',
      port: 0,
      name: '',
    });

    const page = service.getHomePage();

    expect(page).toContain('<dd class="status">Disconnected</dd>');
    expect(page).toContain('<dd>Not connected</dd>');
  });
});

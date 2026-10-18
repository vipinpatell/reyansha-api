
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getApiInfo() {
    return {
      service: 'Reyansha API',
      documentation: `${this.baseUrl}/docs`,
      apis: [
        {
          api: '/api/v1/users',
          url: `${this.baseUrl}/api/v1/users`,
        },
      ],
    };
  }

  getHomePage() {
    const port = this.port;
    const mongoStatus = this.getMongoStatus();

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reyansha API Status</title>
    <style>
      body { max-width: 760px; margin: 48px auto; padding: 0 20px; font: 16px/1.5 system-ui, sans-serif; color: #17202a; }
      h1 { margin-bottom: 4px; }
      .muted { color: #566573; }
      section { margin: 24px 0; padding: 18px 20px; border: 1px solid #d5d8dc; border-radius: 10px; }
      h2 { margin: 0 0 10px; font-size: 1.1rem; }
      dl { display: grid; grid-template-columns: 150px 1fr; gap: 8px 16px; margin: 0; }
      dt { color: #566573; }
      dd { margin: 0; overflow-wrap: anywhere; }
      a { color: #145da0; }
      .status { font-weight: 700; color: ${mongoStatus.connected ? '#18723b' : '#a33b27'}; }
      @media (max-width: 520px) { dl { grid-template-columns: 1fr; gap: 2px; } dd { margin-bottom: 8px; } }
    </style>
  </head>
  <body>
    <h1>Reyansha API</h1>
    <p class="muted">Current project status and service links.</p>
    <section>
      <h2>Project</h2>
      <dl>
        <dt>API status</dt><dd class="status">Running</dd>
        <dt>Environment</dt><dd>${escapeHtml(process.env.NODE_ENV ?? 'development')}</dd>
        <dt>API port</dt><dd>${escapeHtml(String(port))}</dd>
        <dt>API base URL</dt><dd>${escapeHtml(this.baseUrl)}</dd>
        <dt>Uptime</dt><dd>${Math.floor(process.uptime())} seconds</dd>
      </dl>
    </section>
    <section>
      <h2>MongoDB</h2>
      <dl>
        <dt>Connection</dt><dd class="status">${escapeHtml(mongoStatus.label)}</dd>
        <dt>Host</dt><dd>${escapeHtml(mongoStatus.host)}</dd>
        <dt>Port</dt><dd>${escapeHtml(mongoStatus.port)}</dd>
        <dt>Database</dt><dd>${escapeHtml(mongoStatus.database)}</dd>
      </dl>
    </section>
    <section>
      <h2>Links</h2>
      <ul>
        <li><a href="/docs">${escapeHtml(`${this.baseUrl}/docs`)}</a> — API documentation</li>
        <li><a href="/api/v1/users">Users API</a></li>
        <li><a href="/api/v1/health">Health API</a></li>
      </ul>
    </section>
  </body>
</html>`;
  }

  private get baseUrl() {
    return `http://localhost:${this.port}`;
  }

  private get port() {
    return process.env.PORT ?? '3000';
  }

  private getMongoStatus() {
    const connectionState = this.connection.readyState;
    const connected = connectionState === 1;
    const labels = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

    return {
      connected,
      label: labels[connectionState] ?? 'Unknown',
      host: this.connection.host || 'Not connected',
      port: this.connection.port ? String(this.connection.port) : 'Not connected',
      database: this.connection.name || 'Not connected',
    };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

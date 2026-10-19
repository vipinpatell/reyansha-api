import { getAllowedOrigins } from './origins.js';

describe('getAllowedOrigins', () => {
  it('allows Swagger and the dashboard by default', () => {
    expect(getAllowedOrigins()).toEqual([
      'http://localhost:3000',
      'http://localhost:3001',
    ]);
  });

  it('uses explicitly configured origins', () => {
    expect(
      getAllowedOrigins('https://api.example.com, https://admin.example.com'),
    ).toEqual(['https://api.example.com', 'https://admin.example.com']);
  });
});

const request = require('supertest');
const app = require('../app');

describe('CORS Configuration', () => {
  test('should allow cross-origin requests from any domain', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://example.com');
    
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  test('should allow specified HTTP methods', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST');
    
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-methods']).toContain('GET');
    expect(response.headers['access-control-allow-methods']).toContain('PUT');
    expect(response.headers['access-control-allow-methods']).toContain('DELETE');
    expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
  });

  test('should allow specified headers', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
    
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  test('should allow credentials', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://example.com');
    
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('should set appropriate max-age for preflight requests', async () => {
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST');
    
    expect(response.headers['access-control-max-age']).toBe('86400');
  });

  test('should handle preflight requests correctly', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
    
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });
});

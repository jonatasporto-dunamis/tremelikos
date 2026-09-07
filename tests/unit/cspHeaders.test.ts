import { describe, expect, it } from 'vitest';
import nextConfig from '@/next.config.js';

describe('next.config.js security headers', () => {
  it('includes Content-Security-Policy in headers', async () => {
    const headers = await nextConfig.headers();
    const matched = headers
      .flatMap((h) => h.headers || [])
      .find((h) => h.key === 'Content-Security-Policy');

    expect(matched).toBeDefined();
    expect(matched!.value).toContain("default-src 'self'");
    expect(matched!.value).toContain('www.googletagmanager.com');
    expect(matched!.value).toContain('connect.facebook.net');
    expect(matched!.value).toContain('*.supabase.co');
    expect(matched!.value).toContain('form-action');
    expect(matched!.value).toContain("upgrade-insecure-requests");
  });

  it('includes other security headers', async () => {
    const headers = await nextConfig.headers();
    const matched = headers
      .flatMap((h) => h.headers || [])
      .find((h) => h.key === 'Content-Security-Policy');

    expect(matched).toBeDefined();
    const allHeaders = headers.flatMap((h) => h.headers || []);
    expect(allHeaders.some((h) => h.key === 'X-Content-Type-Options')).toBe(true);
    expect(allHeaders.some((h) => h.key === 'X-Frame-Options')).toBe(true);
    expect(allHeaders.some((h) => h.key === 'Referrer-Policy')).toBe(true);
    expect(allHeaders.some((h) => h.key === 'Permissions-Policy')).toBe(true);
  });
});

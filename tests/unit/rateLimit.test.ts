import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const result = checkRateLimit('test-key-1', { interval: 60_000, maxRequests: 2 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('allows up to maxRequests', () => {
    checkRateLimit('test-key-2', { interval: 60_000, maxRequests: 2 });
    const result = checkRateLimit('test-key-2', { interval: 60_000, maxRequests: 2 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks after exceeding maxRequests', () => {
    checkRateLimit('test-key-3', { interval: 60_000, maxRequests: 1 });
    const result = checkRateLimit('test-key-3', { interval: 60_000, maxRequests: 1 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('isolates different keys', () => {
    checkRateLimit('test-key-4', { interval: 60_000, maxRequests: 1 });
    const result = checkRateLimit('test-key-5', { interval: 60_000, maxRequests: 1 });
    expect(result.allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('returns anonymous when no IP headers', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('anonymous');
  });
});

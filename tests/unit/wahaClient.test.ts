import { beforeEach, describe, expect, it, vi } from 'vitest';
import WahaClient from '@/lib/waha';

describe('WahaClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('usa o chatId retornado por contacts/check-exists antes de enviar', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ numberExists: true, chatId: '123456789@lid' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const client = new WahaClient({
      apiUrl: 'http://waha.local',
      apiKey: 'test-key',
      sessionName: 'tremelikos',
      minSendDelayMs: 0,
      maxSendDelayMs: 0,
    });

    const result = await client.sendMessage('+55 73 98824-4991', 'Mensagem teste');

    expect(result).toEqual({ success: true, messageId: 'msg-1' });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://waha.local/api/contacts/check-exists?phone=5573988244991&session=tremelikos',
      expect.any(Object)
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      session: 'tremelikos',
      chatId: '123456789@lid',
      text: 'Mensagem teste',
    });
  });

  it('nao envia quando o numero nao existe no WhatsApp', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ numberExists: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new WahaClient({
      apiUrl: 'http://waha.local',
      apiKey: 'test-key',
      sessionName: 'tremelikos',
      minSendDelayMs: 0,
      maxSendDelayMs: 0,
    });

    const result = await client.sendMessage('+55 73 98824-4991', 'Mensagem teste');

    expect(result).toEqual({ success: false, error: 'number_not_registered' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

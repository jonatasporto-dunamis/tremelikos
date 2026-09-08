interface WahaConfig {
  apiUrl: string;
  apiKey: string;
  sessionName: string;
  minSendDelayMs?: number;
  maxSendDelayMs?: number;
}

interface WahaMessage {
  to: string;
  text: string;
}

class WahaClient {
  private apiUrl: string;
  private apiKey: string;
  private sessionName: string;
  private minSendDelayMs: number;
  private maxSendDelayMs: number;
  private sendQueue: Promise<void> = Promise.resolve();

  constructor(config: WahaConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.sessionName = config.sessionName;
    this.minSendDelayMs = config.minSendDelayMs ?? 1500;
    this.maxSendDelayMs = config.maxSendDelayMs ?? 4500;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
  }

  private async resolveChatId(phone: string): Promise<{ chatId?: string; error?: string }> {
    const query = new URLSearchParams({ phone, session: this.sessionName });
    const response = await fetch(`${this.apiUrl}/api/contacts/check-exists?${query}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      return { chatId: `${phone}@c.us` };
    }

    const data = await response.json() as { numberExists?: boolean; chatId?: string };
    if (data.numberExists === false) {
      return { error: 'number_not_registered' };
    }

    return { chatId: data.chatId || `${phone}@c.us` };
  }

  private async waitForHumanPacedSend() {
    const min = Math.max(0, this.minSendDelayMs);
    const max = Math.max(min, this.maxSendDelayMs);
    if (max === 0) return;

    const delay = min + Math.floor(Math.random() * (max - min + 1));
    this.sendQueue = this.sendQueue
      .catch(() => undefined)
      .then(() => new Promise<void>((resolve) => setTimeout(resolve, delay)));

    await this.sendQueue;
  }

  async sendMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const phone = to.replace(/\D/g, '');
      const { chatId, error } = await this.resolveChatId(phone);
      if (!chatId) {
        return { success: false, error: error || 'chat_id_not_found' };
      }

      await this.waitForHumanPacedSend();

      const response = await fetch(`${this.apiUrl}/api/sendText`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          session: this.sessionName,
          chatId,
          text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async startSession(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sessions/start`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          session: this.sessionName,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async stopSession(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sessions/stop`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          session: this.sessionName,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getSessionStatus(): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sessions/${this.sessionName}`, {
        headers: this.headers,
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.status;
    } catch {
      return null;
    }
  }
}

const wahaConfig: WahaConfig = {
  apiUrl: process.env.WAHA_API_URL || '',
  apiKey: process.env.WAHA_API_KEY || '',
  sessionName: process.env.WAHA_SESSION_NAME || 'tremelikos',
  minSendDelayMs: process.env.NODE_ENV === 'test' ? 0 : Number(process.env.WAHA_MIN_SEND_DELAY_MS || 1500),
  maxSendDelayMs: process.env.NODE_ENV === 'test' ? 0 : Number(process.env.WAHA_MAX_SEND_DELAY_MS || 4500),
};

export const waha = new WahaClient(wahaConfig);
export default WahaClient;

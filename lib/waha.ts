interface WahaConfig {
  apiUrl: string;
  apiKey: string;
  sessionName: string;
}

interface WahaMessage {
  to: string;
  text: string;
}

class WahaClient {
  private apiUrl: string;
  private apiKey: string;
  private sessionName: string;

  constructor(config: WahaConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.sessionName = config.sessionName;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
  }

  async sendMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const phone = to.replace(/\D/g, '');
      const chatId = `${phone}@c.us`;

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
};

export const waha = new WahaClient(wahaConfig);
export default WahaClient;

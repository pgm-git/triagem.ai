// UazAPI Provider — Implementação da API não-oficial
// Docs: https://docs.uazapi.com

import type { IWhatsAppProvider, InstanceStatus, ConnectionResult, SendResult } from './whatsapp-provider';

interface UazAPIConfig {
    baseUrl: string;       // ex: https://subdominio.uazapi.com
    instanceToken: string; // token retornado pelo /instance/init
}

interface UazAPIAdminConfig {
    baseUrl: string;
    adminToken: string;
}

export class UazAPIProvider implements IWhatsAppProvider {
    private baseUrl: string;
    private token: string;

    constructor(config: UazAPIConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.token = config.instanceToken;
    }

    /**
     * Create a new instance (requires adminToken, not instanceToken)
     * POST /instance/init
     */
    static async createInstance(
        config: UazAPIAdminConfig,
        name: string
    ): Promise<{ token: string; error?: string }> {
        try {
            const res = await fetch(`${config.baseUrl}/instance/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'admintoken': config.adminToken,
                },
                body: JSON.stringify({
                    name,
                    systemName: 'TrackerAiPro',
                }),
            });
            const data = await res.json();
            if (!res.ok) return { token: '', error: data.message || 'Falha ao criar instância' };
            return { token: data.token || data.instanceToken || '' };
        } catch (err) {
            return { token: '', error: (err as Error).message };
        }
    }

    /** POST /instance/connect — Gera QR Code */
    async connect(): Promise<ConnectionResult> {
        try {
            const res = await fetch(`${this.baseUrl}/instance/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': this.token,
                },
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.message || 'Falha ao conectar' };
            return {
                success: true,
                qrCode: data.qrcode || data.qrCode || undefined,
                pairingCode: data.pairingCode || undefined,
            };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    /** GET /instance/status */
    async getStatus(): Promise<InstanceStatus> {
        try {
            const res = await fetch(`${this.baseUrl}/instance/status`, {
                headers: { 'token': this.token },
            });
            const data = await res.json();
            return {
                state: data.state === 'open' ? 'connected' : (data.state || 'disconnected'),
                qrCode: data.qrcode || data.qrCode,
                phoneNumber: data.instance?.phone || data.phoneNumber,
            };
        } catch {
            return { state: 'disconnected' };
        }
    }

    /** POST /webhook — Configura destino do webhook */
    async configureWebhook(url: string): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${this.baseUrl}/webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': this.token,
                },
                body: JSON.stringify({
                    enabled: true,
                    url,
                    events: ['messages', 'connection'],
                    excludeMessages: ['wasSentByApi'],
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                return { success: false, error: data.message || 'Falha ao configurar webhook' };
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    /** POST /send/text — Envia mensagem de texto */
    async sendText(to: string, message: string): Promise<SendResult> {
        try {
            const res = await fetch(`${this.baseUrl}/send/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': this.token,
                },
                body: JSON.stringify({
                    number: to,
                    text: message,
                    delay: 1200,
                    linkPreview: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.message || 'Falha ao enviar' };
            return { success: true, messageId: data.key?.id || data.messageId };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }
}

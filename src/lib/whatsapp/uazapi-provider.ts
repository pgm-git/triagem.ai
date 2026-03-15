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

    /** Safe JSON parse — returns null if response is not valid JSON */
    private static async safeJson(res: Response): Promise<Record<string, unknown> | null> {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            console.error(`[UazAPI] Non-JSON response (${res.status}): ${text.substring(0, 200)}`);
            return null;
        }
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
            const url = `${config.baseUrl}/instance/init`;
            console.log(`[UazAPI] Creating instance at: ${url}`);

            const res = await fetch(url, {
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

            const data = await UazAPIProvider.safeJson(res);
            if (!data) {
                return { token: '', error: `UazAPI retornou resposta inválida (status ${res.status}). Verifique UAZAPI_BASE_URL.` };
            }
            if (!res.ok) return { token: '', error: (data.message as string) || `Erro ${res.status}` };

            // UazAPI returns: { instance: { token, qrcode, ... } }
            const inst = data.instance as Record<string, unknown> | undefined;
            const token = (inst?.token || data.token || data.instanceToken || '') as string;
            console.log(`[UazAPI] Init response — token: ${token ? token.substring(0, 8) + '...' : 'EMPTY'}`);
            return { token };
        } catch (err) {
            return { token: '', error: `Conexão falhou: ${(err as Error).message}` };
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
            const data = await UazAPIProvider.safeJson(res);
            if (!data) return { success: false, error: `Resposta inválida (status ${res.status})` };
            if (!res.ok) return { success: false, error: (data.message as string) || 'Falha ao conectar' };

            // UazAPI returns: { connected, instance: { qrcode, paircode, ... } }
            const inst = data.instance as Record<string, unknown> | undefined;
            const qrCode = (inst?.qrcode || inst?.qrCode || data.qrcode || data.qrCode) as string | undefined;
            const pairingCode = (inst?.paircode || inst?.pairingCode || data.pairingCode) as string | undefined;
            console.log(`[UazAPI] Connect response — qrCode: ${qrCode ? qrCode.substring(0, 30) + '...' : 'EMPTY'}`);
            return {
                success: true,
                qrCode: qrCode || undefined,
                pairingCode: pairingCode || undefined,
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
                    ignoreGroups: true,
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

    /** POST /instance/logout — Desconecta a instância */
    async logout(): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${this.baseUrl}/instance/logout`, {
                method: 'POST',
                headers: { 'token': this.token },
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.message || 'Falha ao desconectar' };
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    /** 
     * DELETE /instance — Remove a instância do servidor
     */
    async deleteInstance(): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${this.baseUrl}/instance`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'token': this.token
                },
            });
            const data = await UazAPIProvider.safeJson(res);
            if (!res.ok) return { success: false, error: data?.message as string || 'Falha ao excluir instância' };
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }
}

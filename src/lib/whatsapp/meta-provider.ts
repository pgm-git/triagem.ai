// Meta Cloud API Provider — Implementação da API oficial do WhatsApp
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

import type { IWhatsAppProvider, InstanceStatus, ConnectionResult, SendResult } from './whatsapp-provider';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MetaCloudConfig {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId?: string;
    verifyToken?: string;
}

export class MetaCloudProvider implements IWhatsAppProvider {
    private accessToken: string;
    private phoneNumberId: string;
    private businessAccountId?: string;

    constructor(config: MetaCloudConfig) {
        this.accessToken = config.accessToken;
        this.phoneNumberId = config.phoneNumberId;
        this.businessAccountId = config.businessAccountId;
    }

    /** Validate token by fetching phone number details */
    async connect(): Promise<ConnectionResult> {
        try {
            const res = await fetch(
                `${GRAPH_API_BASE}/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`,
                {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` },
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) {
                return {
                    success: false,
                    error: data.error?.message || 'Token inválido ou Phone Number ID incorreto',
                };
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    /** Check status by validating token */
    async getStatus(): Promise<InstanceStatus> {
        try {
            const res = await fetch(
                `${GRAPH_API_BASE}/${this.phoneNumberId}?fields=verified_name,display_phone_number`,
                {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` },
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) {
                return { state: 'disconnected' };
            }
            return {
                state: 'connected',
                phoneNumber: data.display_phone_number,
                verifiedName: data.verified_name,
            };
        } catch {
            return { state: 'disconnected' };
        }
    }

    /** Meta webhook is configured in the Meta dashboard, not programmatically */
    async configureWebhook(_url: string): Promise<{ success: boolean; error?: string }> {
        // For Meta Cloud API, webhooks are configured in the Meta App Dashboard
        // We store the verify_token for verification but can't configure programmatically
        return {
            success: true,
            error: undefined,
        };
    }

    /** POST /messages — Send a text message */
    async sendText(to: string, message: string): Promise<SendResult> {
        try {
            const res = await fetch(
                `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to,
                        type: 'text',
                        text: { body: message },
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) {
                return { success: false, error: data.error?.message || 'Falha ao enviar' };
            }
            return { success: true, messageId: data.messages?.[0]?.id };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }

    /** Verify webhook challenge (GET request from Meta) */
    static verifyWebhook(
        mode: string | null,
        token: string | null,
        challenge: string | null,
        expectedToken: string
    ): { valid: boolean; challenge?: string } {
        if (mode === 'subscribe' && token === expectedToken) {
            return { valid: true, challenge: challenge || '' };
        }
        return { valid: false };
    }
}

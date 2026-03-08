// Payload normalizer — converte payloads de ambos os providers para formato interno

import type { NormalizedMessage, WhatsAppProvider } from '@/types';

/**
 * Normaliza payload UazAPI → NormalizedMessage
 * UazAPI envia: { event: "messages", data: { key: { remoteJid }, message: { conversation }, pushName } }
 */
export function normalizeUazAPIPayload(body: Record<string, unknown>): NormalizedMessage | null {
    try {
        const data = body.data as Record<string, unknown> | undefined;
        if (!data) return null;

        const key = data.key as Record<string, unknown> | undefined;
        const message = data.message as Record<string, unknown> | undefined;

        const remoteJid = key?.remoteJid as string | undefined;
        if (!remoteJid || remoteJid.includes('@g.us')) return null; // Ignore groups

        const phone = remoteJid.replace('@s.whatsapp.net', '');
        const text =
            (message?.conversation as string) ||
            (message?.extendedTextMessage as Record<string, unknown>)?.text as string ||
            '';

        if (!text) return null;

        return {
            from: phone,
            text,
            timestamp: String(data.messageTimestamp || Date.now()),
            contactName: data.pushName as string | undefined,
            provider: 'uazapi' as WhatsAppProvider,
            rawPayload: body,
        };
    } catch {
        return null;
    }
}

/**
 * Normaliza payload Meta Cloud API → NormalizedMessage
 * Meta envia: { entry: [{ changes: [{ value: { messages: [...], contacts: [...] } }] }] }
 */
export function normalizeMetaPayload(body: Record<string, unknown>): NormalizedMessage | null {
    try {
        const entries = body.entry as Array<Record<string, unknown>> | undefined;
        if (!entries?.length) return null;

        const changes = entries[0].changes as Array<Record<string, unknown>> | undefined;
        if (!changes?.length) return null;

        const value = changes[0].value as Record<string, unknown> | undefined;
        if (!value) return null;

        const messages = value.messages as Array<Record<string, unknown>> | undefined;
        if (!messages?.length) return null;

        const msg = messages[0];
        const contacts = value.contacts as Array<Record<string, unknown>> | undefined;
        const contact = contacts?.[0];

        const textObj = msg.text as Record<string, unknown> | undefined;
        const text = textObj?.body as string || '';

        if (!text) return null;

        return {
            from: msg.from as string,
            text,
            timestamp: msg.timestamp as string || String(Date.now()),
            contactName: (contact?.profile as Record<string, unknown>)?.name as string | undefined,
            provider: 'meta_cloud' as WhatsAppProvider,
            rawPayload: body,
        };
    } catch {
        return null;
    }
}

/**
 * Auto-detect provider and normalize
 */
export function normalizePayload(
    body: Record<string, unknown>,
    provider: WhatsAppProvider
): NormalizedMessage | null {
    if (provider === 'uazapi') {
        return normalizeUazAPIPayload(body);
    }
    return normalizeMetaPayload(body);
}

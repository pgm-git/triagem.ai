import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/webhooks/whatsapp/route';

// ─── Mocks ──────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-123';

beforeEach(() => {
    vi.stubEnv('WHATSAPP_WEBHOOK_SECRET', WEBHOOK_SECRET);
});

// ─── Helper ─────────────────────────────────────────────────

function createRequest(
    method: string,
    options: {
        url?: string;
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
    } = {}
): Request {
    const url = options.url || 'http://localhost:3000/api/webhooks/whatsapp';
    const init: RequestInit = { method };

    if (options.body) {
        init.body = JSON.stringify(options.body);
        init.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    } else if (options.headers) {
        init.headers = options.headers;
    }

    return new Request(url, init);
}

// ─── Tests: GET (Webhook Verification) ─────────────────────

describe('Webhook GET – Verificação Meta', () => {
    it('deve retornar challenge com token válido e mode=subscribe', async () => {
        const url = `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${WEBHOOK_SECRET}&hub.challenge=abc123`;
        const req = createRequest('GET', { url });

        const res = await GET(req);

        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toBe('abc123');
    });

    it('deve retornar 403 com token inválido', async () => {
        const url = `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=abc123`;
        const req = createRequest('GET', { url });

        const res = await GET(req);

        expect(res.status).toBe(403);
    });
});

// ─── Tests: POST (Incoming Messages) ───────────────────────

describe('Webhook POST – Mensagens recebidas', () => {
    it('deve aceitar payload válido com secret correto', async () => {
        const req = createRequest('POST', {
            body: { from: '5511999999999', message: 'Oi, preciso de ajuda', timestamp: Date.now() },
            headers: { 'x-webhook-secret': WEBHOOK_SECRET },
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.received).toBe(true);
    });

    it('deve retornar 401 com secret inválido', async () => {
        const req = createRequest('POST', {
            body: { from: '5511999999999', message: 'Olá' },
            headers: { 'x-webhook-secret': 'wrong-secret' },
        });

        const res = await POST(req);

        expect(res.status).toBe(401);
    });

    it('deve retornar 400 com payload incompleto (sem from/message)', async () => {
        const req = createRequest('POST', {
            body: { timestamp: Date.now() },
            headers: { 'x-webhook-secret': WEBHOOK_SECRET },
        });

        const res = await POST(req);

        expect(res.status).toBe(400);
    });
});

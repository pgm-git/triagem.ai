// WhatsApp Provider Abstraction Layer
// Both UazAPI and Meta Cloud API implement this interface

export interface InstanceStatus {
    state: 'connected' | 'disconnected' | 'qr_pending' | 'connecting';
    qrCode?: string;  // base64 QR code (UazAPI only)
    phoneNumber?: string;
    verifiedName?: string;  // Meta only
}

export interface ConnectionResult {
    success: boolean;
    qrCode?: string;  // base64 (UazAPI)
    pairingCode?: string;
    error?: string;
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface IWhatsAppProvider {
    /** Send a text message */
    sendText(to: string, message: string): Promise<SendResult>;

    /** Get instance connection status */
    getStatus(): Promise<InstanceStatus>;

    /** Initiate connection (QR code for UazAPI, validate token for Meta) */
    connect(): Promise<ConnectionResult>;

    /** Configure webhook URL */
    configureWebhook(url: string): Promise<{ success: boolean; error?: string }>;

    /** Logout instance (disconnect) */
    logout(): Promise<{ success: boolean; error?: string }>;

    /** Delete instance from provider */
    deleteInstance(): Promise<{ success: boolean; error?: string }>;
}

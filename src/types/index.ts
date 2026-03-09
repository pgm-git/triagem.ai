// TypeScript types for TrackerAi Pro
// Auto-generate Supabase types with: npx supabase gen types typescript

export interface OrganizationSettings {
  organization_id: string;
  ai_provider: string;
  ai_model: string;
  ai_temperature: number;
  custom_prompt_base?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPersona {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  prompt_instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  setup_complete: boolean;
  routing_type: 'menu' | 'keywords' | 'hybrid' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'agent';
  created_at: string;
}

export interface SectorTrigger {
  keywords: string[];
  response_template: string;
  type: 'intention' | 'keyword';
  is_active: boolean;
}

export interface CollectionField {
  id: string;
  variable: string;    // ex: "placa"
  label: string;       // ex: "Placa do veículo"
  context: string;     // instrução para o agente IA coletar
  required: boolean;
}

export interface Sector {
  id: string;
  organization_id: string;
  name: string;
  icon?: string;
  destination: string;
  schedule_start?: string;
  schedule_end?: string;
  is_active: boolean;
  is_fallback: boolean;
  fallback_message?: string;
  priority: number;
  keywords?: string[];
  response_template?: string;
  triggers?: SectorTrigger[];
  collection_fields?: CollectionField[];
  created_at: string;
  updated_at: string;
}

export type PersonaTraitId = 'professional' | 'informal' | 'welcoming' | 'objective' | 'consultive' | 'friendly';

export interface PersonaTrait {
  id: PersonaTraitId;
  emoji: string;
  label: string;
  description: string;
}

export interface PersonaConfig {
  selectedTraits: PersonaTraitId[];
  customInstructions?: string;
}

export interface Rule {
  id: string;
  organization_id: string;
  sector_id: string;
  type: 'intention' | 'keyword' | 'exception';
  name: string;
  keywords: string[];
  response_template?: string;
  is_active: boolean;
  priority: number;
  schedule_start?: string;
  schedule_end?: string;
  created_at: string;
  updated_at: string;
}

export type WhatsAppProvider = 'uazapi' | 'meta_cloud';
export type InstanceStatus = 'connected' | 'disconnected' | 'qr_pending' | 'connecting';

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  provider: WhatsAppProvider;
  // UazAPI
  uazapi_token?: string;
  uazapi_url?: string;
  // Meta Cloud
  meta_access_token?: string;
  meta_phone_number_id?: string;
  meta_business_account_id?: string;
  meta_verify_token?: string;
  // Shared
  phone_number?: string;
  status: InstanceStatus;
  webhook_secret: string;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NormalizedMessage {
  from: string;
  text: string;
  timestamp: string;
  contactName?: string;
  provider: WhatsAppProvider;
  rawPayload: unknown;
}

export interface Conversation {
  id: string;
  organization_id: string;
  channel_id: string;
  sector_id: string;
  contact_name: string;
  contact_phone: string;
  status: 'active' | 'resolved' | 'pending_triage';
  last_message_at: string;
  unread_count: number;
  routed_by: 'auto' | 'manual' | 'fallback';
  rule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'client' | 'agent' | 'system';
  sender_id?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  external_id?: string;
  created_at: string;
}

export interface RoutingLog {
  id: string;
  organization_id: string;
  conversation_id: string;
  event_type: 'auto_route' | 'manual_route' | 'fallback' | 'reassign';
  from_sector_id?: string;
  to_sector_id: string;
  rule_id?: string;
  performed_by?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Wizard types
export interface WizardData {
  routingType: Organization['routing_type'];
  sectors: Partial<Sector>[];
  rules: Partial<Rule>[];
  fallback: {
    sectorId: string;
    message: string;
  } | null;
}

-- Migration: Add Slot-Filling fields to Sectors and Conversations
-- Description: collection_fields for sectors and collected_data for conversations

-- 1. Add collection_fields to sectors
ALTER TABLE public.sectors 
ADD COLUMN IF NOT EXISTS collection_fields JSONB DEFAULT '[]'::jsonb;

-- 2. Add collected_data to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS collected_data JSONB DEFAULT '{}'::jsonb;

-- 3. Add commentary for documentation
COMMENT ON COLUMN public.sectors.collection_fields IS 'Array of defining fields the AI should collect before routing (e.g., [{"name": "placa", "required": true, "type": "text"}])';
COMMENT ON COLUMN public.conversations.collected_data IS 'Key-value pairs of data collected by the AI during the conversation lifecycle';

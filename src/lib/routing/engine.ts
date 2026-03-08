import type { Rule } from '@/types';

interface RoutingResult {
    matched: boolean;
    ruleId: string | null;
    sectorId: string | null;
    responseTemplate: string | null;
    method: 'auto' | 'fallback';
}

/**
 * Routing Engine
 * Matches incoming messages against active rules to determine the target sector.
 */
export function routeMessage(
    messageContent: string,
    activeRules: Rule[],
    fallbackSectorId: string,
    fallbackMessage: string
): RoutingResult {
    const normalizedContent = messageContent.toLowerCase().trim();

    // Sort rules by priority (lower = higher priority)
    const sortedRules = [...activeRules]
        .filter((r) => r.is_active)
        .sort((a, b) => a.priority - b.priority);

    // Try each rule
    for (const rule of sortedRules) {
        // Check if message matches any keyword
        const matched = rule.keywords.some((keyword) =>
            normalizedContent.includes(keyword.toLowerCase())
        );

        if (matched) {
            return {
                matched: true,
                ruleId: rule.id,
                sectorId: rule.sector_id,
                responseTemplate: rule.response_template || null,
                method: 'auto',
            };
        }
    }

    // No rule matched — use fallback
    return {
        matched: false,
        ruleId: null,
        sectorId: fallbackSectorId,
        responseTemplate: fallbackMessage,
        method: 'fallback',
    };
}

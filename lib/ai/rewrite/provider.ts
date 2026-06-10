import { buildRewritePrompts } from '@/lib/ai/rewrite/prompts';
import { generateWithClaude } from './providers/claude';
import { generateWithOpenAI } from './providers/openai';

export interface RewriteProviderInputItem {
  path: string;
  fieldPath: string;
  sourceText: string;
}

export interface RewriteProviderOutputItem {
  path: string;
  fieldPath: string;
  rewrittenText: string;
}

export interface RewriteProviderRequest {
  provider: string;
  model?: string | null;
  siteId: string;
  locale: string;
  scope: string;
  mode: 'conservative' | 'balanced' | 'aggressive' | string;
  targetPaths: string[];
  requirements?: unknown;
  items: RewriteProviderInputItem[];
  voiceProfile?: string;
  overrideModeInstructions?: string;
}

interface RewriteModeProfile {
  temperature: number;
  topP: number;
  modeInstructions: string;
}

const MODE_PROFILES: Record<'conservative' | 'balanced' | 'aggressive', RewriteModeProfile> = {
  conservative: {
    temperature: 0.2,
    topP: 0.9,
    modeInstructions:
      'Make safe but clear rewrites. Preserve structure where possible. Keep near-original length and tone.',
  },
  balanced: {
    temperature: 0.45,
    topP: 0.92,
    modeInstructions:
      'Rewrite with noticeable sentence-level restructuring. Avoid simple synonym substitution.',
  },
  aggressive: {
    temperature: 0.7,
    topP: 0.95,
    modeInstructions:
      'Perform substantial re-expression at paragraph/sentence level: rewrite lead sentence, vary sentence shapes, and reorder clauses while preserving meaning.',
  },
};

function resolveModeProfile(modeRaw: string): RewriteModeProfile {
  const key = (modeRaw || 'balanced').toLowerCase();
  if (key === 'conservative') return MODE_PROFILES.conservative;
  if (key === 'aggressive') return MODE_PROFILES.aggressive;
  return MODE_PROFILES.balanced;
}

export function isRewriteProviderConfigured(providerRaw: string): boolean {
  const provider = providerRaw.toLowerCase();
  if (provider === 'claude') {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }
  if (provider === 'openai') {
    return Boolean(process.env.OPENAI_API_KEY);
  }
  return false;
}

export async function generateRewriteWithProvider(
  request: RewriteProviderRequest
): Promise<RewriteProviderOutputItem[]> {
  const provider = request.provider.toLowerCase();
  const modeProfile = resolveModeProfile(request.mode);
  const fieldAllowlist = request.items.map((item) => item.fieldPath);
  const { systemPrompt, userPrompt } = await buildRewritePrompts({
    siteId: request.siteId,
    locale: request.locale,
    scope: request.scope,
    mode: request.mode,
    modeInstructions: request.overrideModeInstructions || modeProfile.modeInstructions,
    voiceProfile: request.voiceProfile,
    requirements: request.requirements,
    targetPaths: request.targetPaths,
    fieldAllowlist,
    inputJson: {
      items: request.items,
    },
  });

  if (provider === 'claude') {
    return generateWithClaude({
      model: request.model,
      systemPrompt,
      userPrompt,
      temperature: modeProfile.temperature,
      topP: modeProfile.topP,
    });
  }
  if (provider === 'openai') {
    return generateWithOpenAI({
      model: request.model,
      systemPrompt,
      userPrompt,
      temperature: modeProfile.temperature,
      topP: modeProfile.topP,
    });
  }
  throw new Error(`Unsupported rewrite provider: ${request.provider}`);
}

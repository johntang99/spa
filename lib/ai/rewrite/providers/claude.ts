import type { RewriteProviderOutputItem } from '@/lib/ai/rewrite/provider';

interface ClaudeRequest {
  model?: string | null;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  topP?: number;
}

function parseJsonObjectFromText(rawText: string): any {
  const trimmed = rawText.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const sanitize = (value: string) => value.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(withoutFences);
  } catch {
    const start = withoutFences.indexOf('{');
    const end = withoutFences.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const sliced = withoutFences.slice(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch {
        return JSON.parse(sanitize(sliced));
      }
    }
    throw new Error('Claude response is not valid JSON');
  }
}

export async function generateWithClaude(
  request: ClaudeRequest
): Promise<RewriteProviderOutputItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing');
  }

  const model =
    request.model ||
    process.env.AI_REWRITE_CLAUDE_MODEL ||
    process.env.ANTHROPIC_MAIN_MODEL ||
    'claude-sonnet-4-6';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: typeof request.temperature === 'number' ? request.temperature : 0.2,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      }),
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Claude request timed out after 90s');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Claude API error (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  const text = Array.isArray(payload?.content)
    ? payload.content
        .map((entry: any) => (entry?.type === 'text' ? entry.text : ''))
        .join('\n')
        .trim()
    : '';

  const parsed = parseJsonObjectFromText(text);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  return items
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any) => ({
      path: String(item.path || ''),
      fieldPath: String(item.fieldPath || ''),
      rewrittenText: String(item.rewrittenText || '').trim(),
    }))
    .filter((item: RewriteProviderOutputItem) => item.path && item.fieldPath && item.rewrittenText);
}

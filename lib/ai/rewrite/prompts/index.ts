import fs from 'fs/promises';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'lib', 'ai', 'rewrite', 'prompts');

let cachedSystemPrompt: string | null = null;
let cachedRequestTemplate: string | null = null;

function renderTemplate(template: string, values: Record<string, string>): string {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

async function loadPromptFiles() {
  if (!cachedSystemPrompt) {
    cachedSystemPrompt = await fs.readFile(path.join(PROMPTS_DIR, 'system.txt'), 'utf-8');
  }
  if (!cachedRequestTemplate) {
    cachedRequestTemplate = await fs.readFile(
      path.join(PROMPTS_DIR, 'rewrite-request.template.txt'),
      'utf-8'
    );
  }
  return {
    systemPrompt: cachedSystemPrompt,
    requestTemplate: cachedRequestTemplate,
  };
}

export interface RewritePromptContext {
  siteId: string;
  locale: string;
  scope: string;
  mode: string;
  voiceProfile?: string;
  modeInstructions?: string;
  requirements?: unknown;
  targetPaths: string[];
  fieldAllowlist: string[];
  inputJson: unknown;
}

export async function buildRewritePrompts(context: RewritePromptContext) {
  const { systemPrompt, requestTemplate } = await loadPromptFiles();

  const userPrompt = renderTemplate(requestTemplate, {
    siteId: context.siteId,
    locale: context.locale,
    scope: context.scope,
    mode: context.mode,
    voiceProfile: context.voiceProfile || '(not provided)',
    modeInstructions: context.modeInstructions || '(no extra instructions)',
    requirements: JSON.stringify(context.requirements || {}, null, 2),
    targetPaths: JSON.stringify(context.targetPaths, null, 2),
    fieldAllowlist: JSON.stringify(context.fieldAllowlist, null, 2),
    inputJson: JSON.stringify(context.inputJson, null, 2),
  });

  return {
    systemPrompt,
    userPrompt,
  };
}

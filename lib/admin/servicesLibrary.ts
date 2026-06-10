import fs from 'fs/promises';
import path from 'path';

export interface ServicesMasterData {
  version: number;
  locale: string;
  modalities: Array<{
    id: string;
    title: string;
    shortDescriptionCore: string;
    fullDescriptionCore: string;
    whatToExpectCore: string;
    benefitsCore: string[];
  }>;
}

export interface SiteVoiceProfilesData {
  version: number;
  locale: string;
  sites: Record<
    string,
    {
      clinicName: string;
      toneDescriptor: string;
      localContext: string;
      lexiconReplacements?: Record<string, string>;
      templates: {
        shortDescription: string;
        fullDescriptionLead: string;
        whatToExpectLead: string;
      };
    }
  >;
}

export class SharedLibraryForbiddenOverrideError extends Error {
  constructor(message = 'Only super_admin can override master/profiles content') {
    super(message);
    this.name = 'SharedLibraryForbiddenOverrideError';
  }
}

const masterPath = path.join(
  process.cwd(),
  'content',
  'shared',
  'services-library',
  'services.master.en.json'
);
const profilesPath = path.join(
  process.cwd(),
  'content',
  'shared',
  'services-library',
  'site-voice-profiles.en.json'
);

export async function readServicesMaster(): Promise<ServicesMasterData> {
  const raw = await fs.readFile(masterPath, 'utf-8');
  return JSON.parse(raw) as ServicesMasterData;
}

export async function writeServicesMaster(data: ServicesMasterData) {
  await fs.writeFile(masterPath, JSON.stringify(data, null, 2));
}

export async function readSiteVoiceProfiles(): Promise<SiteVoiceProfilesData> {
  const raw = await fs.readFile(profilesPath, 'utf-8');
  return JSON.parse(raw) as SiteVoiceProfilesData;
}

export async function writeSiteVoiceProfiles(data: SiteVoiceProfilesData) {
  await fs.writeFile(profilesPath, JSON.stringify(data, null, 2));
}

interface SharedLibraryGenerationInputOptions {
  isSuperAdmin: boolean;
  siteId: string;
}

export async function resolveSharedLibraryGenerationInput(
  payload: Record<string, unknown>,
  options: SharedLibraryGenerationInputOptions
) {
  const hasMasterOverride = typeof payload.masterContent === 'string';
  const hasProfilesOverride = typeof payload.profilesContent === 'string';

  if (!options.isSuperAdmin && (hasMasterOverride || hasProfilesOverride)) {
    throw new SharedLibraryForbiddenOverrideError();
  }

  const master = hasMasterOverride
    ? (JSON.parse(payload.masterContent as string) as ServicesMasterData)
    : await readServicesMaster();
  const profiles = hasProfilesOverride
    ? (JSON.parse(payload.profilesContent as string) as SiteVoiceProfilesData)
    : await readSiteVoiceProfiles();

  if (!options.isSuperAdmin && typeof payload.profileContent === 'string') {
    profiles.sites = profiles.sites || {};
    profiles.sites[options.siteId] = JSON.parse(payload.profileContent);
  }

  return { master, profiles };
}

function applyTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

function applyLexicon(text: string, replacements: Record<string, string> = {}) {
  let next = text;
  for (const [from, to] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    next = next.replace(regex, to);
  }
  return next;
}

export function generateServicesForSite(
  master: ServicesMasterData,
  profiles: SiteVoiceProfilesData,
  siteId: string
) {
  const profile = profiles.sites?.[siteId];
  if (!profile) {
    throw new Error(`Missing site voice profile for "${siteId}"`);
  }

  return master.modalities.map((modality) => {
    const shortDescription = applyLexicon(
      applyTemplate(profile.templates.shortDescription, {
        core: modality.shortDescriptionCore,
        localContext: profile.localContext,
      }),
      profile.lexiconReplacements
    );

    const fullDescription = [
      applyTemplate(profile.templates.fullDescriptionLead, {
        title: modality.title,
        toneDescriptor: profile.toneDescriptor,
        clinicName: profile.clinicName,
      }),
      '',
      applyLexicon(modality.fullDescriptionCore, profile.lexiconReplacements),
    ].join('\n');

    const whatToExpect = [
      applyTemplate(profile.templates.whatToExpectLead, {
        clinicName: profile.clinicName,
      }),
      ' ',
      applyLexicon(modality.whatToExpectCore, profile.lexiconReplacements),
    ].join('');

    return {
      id: modality.id,
      title: modality.title,
      shortDescription,
      fullDescription,
      whatToExpect,
      benefits: modality.benefitsCore.map((item) =>
        applyLexicon(item, profile.lexiconReplacements)
      ),
    };
  });
}

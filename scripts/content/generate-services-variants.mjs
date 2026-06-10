#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
    args[key.slice(2)] = value;
    if (value !== 'true') i += 1;
  }
  return args;
}

function applyTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

function applyLexicon(text, replacements) {
  let next = text;
  for (const [from, to] of Object.entries(replacements || {})) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    next = next.replace(regex, to);
  }
  return next;
}

function buildServiceCopy(modality, profile) {
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

  const benefits = modality.benefitsCore.map((item) =>
    applyLexicon(item, profile.lexiconReplacements)
  );

  return {
    id: modality.id,
    title: modality.title,
    shortDescription,
    fullDescription,
    whatToExpect,
    benefits,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const siteId = args.site;
  if (!siteId) {
    throw new Error('Missing required arg: --site <site-id>');
  }

  const root = process.cwd();
  const masterPath =
    args.master ||
    path.join(root, 'content/shared/services-library/services.master.en.json');
  const profilesPath =
    args.profiles ||
    path.join(root, 'content/shared/services-library/site-voice-profiles.en.json');
  const targetPath = args.target;
  const outPath = args.out;

  const [masterRaw, profilesRaw] = await Promise.all([
    fs.readFile(masterPath, 'utf-8'),
    fs.readFile(profilesPath, 'utf-8'),
  ]);
  const master = JSON.parse(masterRaw);
  const profiles = JSON.parse(profilesRaw);

  const profile = profiles.sites?.[siteId];
  if (!profile) {
    throw new Error(`No site voice profile found for "${siteId}" in ${profilesPath}`);
  }

  const generatedItems = master.modalities.map((modality) =>
    buildServiceCopy(modality, profile)
  );

  let output;
  if (targetPath) {
    const targetRaw = await fs.readFile(targetPath, 'utf-8');
    const target = JSON.parse(targetRaw);
    const byId = new Map(generatedItems.map((item) => [item.id, item]));
    const mergedItems = Array.isArray(target.servicesList?.items)
      ? target.servicesList.items.map((item) => {
          const generated = byId.get(item?.id);
          if (!generated) return item;
          return {
            ...item,
            title: generated.title,
            shortDescription: generated.shortDescription,
            fullDescription: generated.fullDescription,
            whatToExpect: generated.whatToExpect,
            benefits: generated.benefits,
          };
        })
      : generatedItems;
    output = {
      ...target,
      servicesList: {
        ...(target.servicesList || {}),
        items: mergedItems,
      },
    };
  } else {
    output = {
      siteId,
      servicesList: {
        items: generatedItems,
      },
    };
  }

  const outputText = JSON.stringify(output, null, 2);
  if (outPath) {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, outputText);
    console.log(`Generated services copy written to: ${outPath}`);
    return;
  }
  console.log(outputText);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

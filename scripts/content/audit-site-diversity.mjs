#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
    args[key.slice(2)] = value;
    if (value !== 'true') i += 1;
  }
  return args;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function flattenStrings(value, out = []) {
  if (typeof value === 'string') {
    const trimmed = value.replace(/\s+/g, ' ').trim();
    if (
      trimmed &&
      !/^https?:\/\//i.test(trimmed) &&
      !/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(trimmed) &&
      !/^(tel:|\+?\d[\d().\-\s]+)$/.test(trimmed)
    ) {
      out.push(trimmed);
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenStrings(item, out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => flattenStrings(item, out));
  }
  return out;
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z']+/g) || [];
}

function wordJaccard(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 && sb.size === 0) return 1;
  let intersection = 0;
  for (const token of sa) {
    if (sb.has(token)) intersection += 1;
  }
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 1 : intersection / union;
}

function sentenceSet(text) {
  return new Set(
    text
      .split(/(?<=[.!?])\s+|\n+/g)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );
}

function sentenceOverlap(a, b) {
  const sa = sentenceSet(a);
  const sb = sentenceSet(b);
  if (sa.size === 0) return 0;
  let exact = 0;
  for (const s of sa) {
    if (sb.has(s)) exact += 1;
  }
  return exact / sa.size;
}

function readPage(contentRoot, siteId, locale, page) {
  const filePath = path.join(contentRoot, siteId, locale, 'pages', `${page}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing page file: ${filePath}`);
  }
  return readJson(filePath);
}

function sectionText(doc, page) {
  if (page === 'services') {
    return flattenStrings(doc);
  }
  if (page === 'conditions') {
    return flattenStrings(doc);
  }
  return flattenStrings(doc);
}

function pairMetrics(contentRoot, siteA, siteB, locale) {
  const pages = ['services', 'conditions'];
  const results = {};
  for (const page of pages) {
    const aDoc = readPage(contentRoot, siteA, locale, page);
    const bDoc = readPage(contentRoot, siteB, locale, page);
    const aText = sectionText(aDoc, page).join('\n');
    const bText = sectionText(bDoc, page).join('\n');
    results[page] = {
      wordJaccard: Number(wordJaccard(aText, bText).toFixed(4)),
      sentenceOverlapPct: Number((sentenceOverlap(aText, bText) * 100).toFixed(2)),
    };
  }
  return results;
}

function printPair(label, metrics) {
  console.log(`\n[${label}]`);
  console.log(
    `services: wordJaccard=${metrics.services.wordJaccard}, sentenceOverlap=${metrics.services.sentenceOverlapPct}%`
  );
  console.log(
    `conditions: wordJaccard=${metrics.conditions.wordJaccard}, sentenceOverlap=${metrics.conditions.sentenceOverlapPct}%`
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteA = args.siteA;
  const siteB = args.siteB;
  if (!siteA || !siteB) {
    console.error(
      'Usage: node scripts/content/audit-site-diversity.mjs --siteA <id> --siteB <id> [--locale en] [--baselines tcm-network,goshen-acupuncture] [--maxWordJaccard 0.62] [--maxSentenceOverlapPct 45]'
    );
    process.exit(1);
  }

  const locale = args.locale || 'en';
  const baselines = (args.baselines || 'tcm-network,goshen-acupuncture')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const maxWordJaccard = Number(args.maxWordJaccard || 0.62);
  const maxSentenceOverlapPct = Number(args.maxSentenceOverlapPct || 45);
  const contentRoot = path.resolve(args.contentRoot || 'content');

  const checks = [];
  const primary = pairMetrics(contentRoot, siteA, siteB, locale);
  printPair(`${siteA} vs ${siteB}`, primary);
  checks.push({ name: `${siteA} vs ${siteB}`, metrics: primary });

  for (const baseline of baselines) {
    if (baseline === siteA || baseline === siteB) continue;
    const aVsBase = pairMetrics(contentRoot, siteA, baseline, locale);
    const bVsBase = pairMetrics(contentRoot, siteB, baseline, locale);
    printPair(`${siteA} vs ${baseline}`, aVsBase);
    printPair(`${siteB} vs ${baseline}`, bVsBase);
    checks.push({ name: `${siteA} vs ${baseline}`, metrics: aVsBase });
    checks.push({ name: `${siteB} vs ${baseline}`, metrics: bVsBase });
  }

  const failures = [];
  for (const check of checks) {
    for (const page of ['services', 'conditions']) {
      const data = check.metrics[page];
      if (data.wordJaccard > maxWordJaccard) {
        failures.push(
          `${check.name} ${page}: wordJaccard ${data.wordJaccard} > ${maxWordJaccard}`
        );
      }
      if (data.sentenceOverlapPct > maxSentenceOverlapPct) {
        failures.push(
          `${check.name} ${page}: sentenceOverlap ${data.sentenceOverlapPct}% > ${maxSentenceOverlapPct}%`
        );
      }
    }
  }

  console.log('\nThresholds');
  console.log(`- maxWordJaccard: ${maxWordJaccard}`);
  console.log(`- maxSentenceOverlapPct: ${maxSentenceOverlapPct}%`);

  if (failures.length > 0) {
    console.log('\nFAIL');
    failures.forEach((line) => console.log(`- ${line}`));
    process.exit(2);
  }

  console.log('\nPASS - diversity thresholds satisfied.');
}

main();

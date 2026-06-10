// System S — declarative admin form-field definitions per section type.
// "Modular ContentEditor pattern §18.7": each section type maps to a field spec a
// generic form renderer consumes (built into the admin in Phase 1/2H). Field specs
// are derived from the section contracts in sections.ts. `loc: true` marks a field
// that is translated per-locale file.
import { SECTION_SCHEMAS, SectionType } from './sections';

export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'select' | 'media'
  | 'toggle' | 'number' | 'array' | 'ref' | 'cta' | 'multiselect';

export interface FieldDef {
  name: string;          // key (dot path within the section object)
  label: string;
  type: FieldType;
  required?: boolean;
  loc?: boolean;         // translated per-locale file
  options?: readonly string[]; // select/multiselect
  of?: FieldDef[];       // array item shape
  help?: string;
}

/** Variant enum options pulled live from each section's zod schema (single source). */
function variantOptions(type: SectionType): readonly string[] {
  const schema: any = SECTION_SCHEMAS[type].schema;
  const v = schema?.shape?.variant;
  // zod enum exposes .options; defaulted/optional wrappers expose ._def.innerType
  return v?.options ?? v?._def?.innerType?.options ?? v?._def?.values ?? [];
}

const VARIANT = (type: SectionType): FieldDef => ({
  name: 'variant', label: 'Variant', type: 'select', required: true, options: variantOptions(type),
});

const CTA_GROUP = (name = 'ctaPrimary', label = 'Primary CTA'): FieldDef => ({
  name, label, type: 'cta',
  of: [
    { name: 'label', label: 'Label', type: 'text', loc: true },
    { name: 'href', label: 'Link', type: 'text' },
  ],
});

export const SECTION_FORMS: Record<SectionType, FieldDef[]> = {
  hero: [
    VARIANT('hero'),
    { name: 'eyebrow', label: 'Eyebrow', type: 'text', loc: true },
    { name: 'headline', label: 'Headline (= SEO H1 on SEO pages)', type: 'text', required: true, loc: true },
    { name: 'subline', label: 'Subline', type: 'textarea', required: true, loc: true },
    { name: 'badges', label: 'Badges', type: 'array', of: [
      { name: 'iconKey', label: 'Icon', type: 'text' }, { name: 'label', label: 'Label', type: 'text', loc: true } ] },
    CTA_GROUP(), CTA_GROUP('ctaSecondary', 'Secondary CTA'),
    { name: 'media.image', label: 'Image', type: 'media' },
    { name: 'media.video', label: 'Video', type: 'media' },
    { name: 'media.scrim', label: 'Scrim (0–60)', type: 'number' },
    { name: 'serviceRef', label: 'Service (chips)', type: 'ref' },
    { name: 'campaignAware', label: 'Campaign-aware', type: 'toggle' },
  ],
  trustBar: [
    VARIANT('trustBar'),
    { name: 'items', label: 'Items (2–5)', type: 'array', of: [
      { name: 'type', label: 'Type', type: 'select', options: ['rating', 'licensed', 'hygiene', 'hours', 'bilingual', 'custom'] },
      { name: 'label', label: 'Label', type: 'text', loc: true }, { name: 'iconKey', label: 'Icon', type: 'text' } ] },
  ],
  categoryGrid: [
    VARIANT('categoryGrid'),
    { name: 'intro', label: 'Intro', type: 'textarea', loc: true },
    { name: 'categories', label: 'Categories ("all" or refs)', type: 'multiselect' },
    { name: 'showCounts', label: 'Show counts', type: 'toggle' },
    { name: 'showPriceFrom', label: 'Show price-from', type: 'toggle' },
  ],
  serviceCards: [
    VARIANT('serviceCards'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'source.mode', label: 'Source mode', type: 'select', options: ['refs', 'category', 'tag'] },
    { name: 'source.category', label: 'Category', type: 'text' },
    { name: 'source.tag', label: 'Tag', type: 'text' },
    { name: 'source.limit', label: 'Limit', type: 'number' },
    { name: 'showTierChips', label: 'Tier chips', type: 'toggle' },
    { name: 'bookCta', label: 'Book CTA', type: 'toggle' },
  ],
  menuTable: [
    VARIANT('menuTable'),
    { name: 'categories', label: 'Categories ("all" or list)', type: 'multiselect' },
    { name: 'serviceRef', label: 'Service (compact)', type: 'ref' },
    { name: 'limit', label: 'Limit (teaser)', type: 'number' },
    { name: 'showAddOns', label: 'Show add-ons', type: 'toggle' },
    { name: 'bookCtaLabel', label: 'Book CTA label', type: 'text', loc: true },
  ],
  addOnsList: [
    VARIANT('addOnsList'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'filterAppliesTo', label: 'Applies to service', type: 'ref' },
  ],
  steps: [
    VARIANT('steps'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'items', label: 'Steps (3–6)', type: 'array', of: [
      { name: 'title', label: 'Title', type: 'text', required: true, loc: true },
      { name: 'body', label: 'Body', type: 'textarea', required: true, loc: true },
      { name: 'iconKey', label: 'Icon', type: 'text' } ] },
  ],
  iconGrid: [
    VARIANT('iconGrid'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'items', label: 'Items (3–6) — benefits pass claims check', type: 'array', of: [
      { name: 'iconKey', label: 'Icon', type: 'text' },
      { name: 'title', label: 'Title', type: 'text', required: true, loc: true },
      { name: 'body', label: 'Body', type: 'textarea', required: true, loc: true } ] },
  ],
  featurePanel: [
    VARIANT('featurePanel'),
    { name: 'eyebrow', label: 'Eyebrow', type: 'text', loc: true },
    { name: 'heading', label: 'Heading', type: 'text', required: true, loc: true },
    { name: 'body', label: 'Body', type: 'textarea', required: true, loc: true },
    { name: 'bullets', label: 'Bullets (≤5)', type: 'array', of: [{ name: '', label: 'Bullet', type: 'text', loc: true }] },
    { name: 'media', label: 'Media', type: 'media', required: true },
    { name: 'mediaSide', label: 'Media side', type: 'select', options: ['left', 'right'] },
    CTA_GROUP('cta', 'CTA'),
    { name: 'packageRef', label: 'Package (membership)', type: 'ref' },
  ],
  promoStrip: [
    VARIANT('promoStrip'),
    { name: 'heading', label: 'Heading', type: 'text', required: true, loc: true },
    { name: 'subline', label: 'Subline', type: 'text', loc: true },
    CTA_GROUP('cta', 'CTA'),
    { name: 'media', label: 'Media', type: 'media' },
    { name: 'campaignAware', label: 'Campaign-aware', type: 'toggle' },
  ],
  testimonials: [
    VARIANT('testimonials'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'filter.categoryTag', label: 'Category tag', type: 'text' },
    { name: 'filter.serviceRef', label: 'Service', type: 'ref' },
    { name: 'filter.scopeTag', label: 'Scope tag', type: 'text' },
    { name: 'filter.limit', label: 'Limit', type: 'number' },
    { name: 'showSource', label: 'Show source', type: 'toggle' },
  ],
  teamGrid: [
    VARIANT('teamGrid'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'refs', label: 'Team ("all" or refs)', type: 'multiselect' },
    { name: 'serviceRef', label: 'Service (therapistNote)', type: 'ref' },
  ],
  richText: [
    VARIANT('richText'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'body', label: 'Body (markdown)', type: 'richtext', required: true, loc: true },
  ],
  faq: [
    VARIANT('faq'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'source.scopeTag', label: 'Scope tag', type: 'text' },
    { name: 'source.limit', label: 'Limit', type: 'number' },
    { name: 'emitSchema', label: 'Emit FAQ schema', type: 'toggle' },
  ],
  ctaBanner: [
    VARIANT('ctaBanner'),
    { name: 'heading', label: 'Heading', type: 'text', required: true, loc: true },
    { name: 'subline', label: 'Subline', type: 'text', loc: true },
    CTA_GROUP(), CTA_GROUP('ctaSecondary', 'Secondary CTA'),
    { name: 'media', label: 'Media (image-bg)', type: 'media' },
    { name: 'showNap', label: 'Show NAP', type: 'toggle' },
  ],
  napHours: [
    VARIANT('napHours'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'note', label: 'Note (parking etc.)', type: 'text', loc: true },
  ],
  mapBlock: [
    VARIANT('mapBlock'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'townRef', label: 'Town (directionsFrom)', type: 'text' },
    { name: 'areaNote', label: 'Area note', type: 'text', loc: true },
    { name: 'lazy', label: 'Lazy load', type: 'toggle' },
  ],
  contactForm: [
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'successMessage', label: 'Success message', type: 'textarea', required: true, loc: true },
  ],
  bookingForm: [
    VARIANT('bookingForm'),
    { name: 'successHeading', label: 'Success heading', type: 'text', required: true, loc: true },
    { name: 'successBody', label: 'Success body', type: 'textarea', required: true, loc: true },
    { name: 'packageRef', label: 'Package (inquiry)', type: 'ref' },
  ],
  altPaths: [
    { name: 'showCall', label: 'Show call', type: 'toggle' },
    { name: 'showWechat', label: 'Show WeChat (auto zh)', type: 'toggle' },
    { name: 'showExternal', label: 'Show external scheduler', type: 'toggle' },
  ],
  galleryGrid: [
    VARIANT('galleryGrid'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'collections', label: 'Collections', type: 'multiselect', options: ['rooms', 'treatments', 'details'] },
    { name: 'video', label: 'Video', type: 'media' },
  ],
  statsBand: [
    { name: 'items', label: 'Stats (3–4)', type: 'array', of: [
      { name: 'value', label: 'Value', type: 'text', required: true },
      { name: 'suffix', label: 'Suffix', type: 'text' },
      { name: 'label', label: 'Label', type: 'text', required: true, loc: true },
      { name: 'source', label: 'Source', type: 'select', options: ['manual', 'yearsInBusiness', 'servicesCount', 'teamCount', 'reviewCount'] } ] },
    { name: 'animate', label: 'Animate', type: 'toggle' },
  ],
  checklist: [
    { name: 'heading', label: 'Heading', type: 'text', required: true, loc: true },
    { name: 'items', label: 'Items (4–8)', type: 'array', of: [
      { name: 'iconKey', label: 'Icon', type: 'text' },
      { name: 'label', label: 'Label', type: 'text', required: true, loc: true } ] },
  ],
  treatmentSelector: [
    VARIANT('treatmentSelector'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'intro', label: 'Intro', type: 'textarea', loc: true },
  ],
  productGrid: [
    VARIANT('productGrid'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'intro', label: 'Intro', type: 'textarea', loc: true },
    { name: 'productRefs', label: 'Products (ordered)', type: 'multiselect' },
  ],
  packageGrid: [
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'refs', label: 'Packages ("all" or refs)', type: 'multiselect' },
  ],
  comparisonTable: [
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'packageRef', label: 'Package', type: 'ref', required: true },
  ],
  protectedNotice: [
    { name: 'body', label: 'Notice body (markdown) — non-deletable', type: 'richtext', required: true, loc: true },
  ],
  reviewedBy: [
    { name: 'teamRef', label: 'Reviewed by (team)', type: 'ref', required: true },
    { name: 'dateReviewed', label: 'Date reviewed', type: 'text', required: true },
  ],
  articleHero: [
    { name: 'headline', label: 'Headline (= SEO H1)', type: 'text', required: true, loc: true },
    { name: 'directAnswer', label: 'Direct answer (first paragraph)', type: 'richtext', required: true, loc: true },
    { name: 'media', label: 'Media', type: 'media' },
  ],
  toc: [],
  relatedLinks: [
    VARIANT('relatedLinks'),
    { name: 'heading', label: 'Heading', type: 'text', loc: true },
    { name: 'refs', label: 'Refs', type: 'multiselect' },
    { name: 'auto', label: 'Auto-resolve', type: 'toggle' },
  ],
  blogList: [
    { name: 'featured', label: 'Featured post', type: 'ref' },
    { name: 'perPage', label: 'Per page', type: 'number' },
  ],
};

/** Field definition for a section type (for the generic admin form renderer). */
export function getSectionForm(type: SectionType): FieldDef[] {
  return SECTION_FORMS[type] ?? [];
}

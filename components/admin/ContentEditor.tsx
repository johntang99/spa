'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';
import { CONTENT_TEMPLATES } from '@/lib/admin/templates';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';
import { SeoPanel } from '@/components/admin/panels/SeoPanel';
import { HeaderPanel } from '@/components/admin/panels/HeaderPanel';
import { ThemePanel } from '@/components/admin/panels/ThemePanel';
import ThemePresetsTab from '@/components/admin/ThemePresetsTab';
import { SectionVariantsPanel } from '@/components/admin/panels/SectionVariantsPanel';
import { ConditionsLayoutPanel } from '@/components/admin/panels/ConditionsLayoutPanel';
import { HomeSectionPhotosPanel } from '@/components/admin/panels/HomeSectionPhotosPanel';
import { HeroPanel } from '@/components/admin/panels/HeroPanel';
import { ProfilePanel } from '@/components/admin/panels/ProfilePanel';
import { IntroductionPanel } from '@/components/admin/panels/IntroductionPanel';
import { AboutAdditionalPanel } from '@/components/admin/panels/AboutAdditionalPanel';
import { AboutStaffsPanel } from '@/components/admin/panels/AboutStaffsPanel';
import { AboutCredentialsPanel } from '@/components/admin/panels/AboutCredentialsPanel';
import { AboutAffiliationsPanel } from '@/components/admin/panels/AboutAffiliationsPanel';
import { normalizeAboutFormData, finalizeAboutFormForSave } from '@/lib/admin/about-form-normalize';
import { GalleryPhotosPanel } from '@/components/admin/panels/GalleryPhotosPanel';
import { CtaPanel } from '@/components/admin/panels/CtaPanel';
import { ReviewsWidgetPanel } from '@/components/admin/panels/ReviewsWidgetPanel';
import { ServicesPanel } from '@/components/admin/panels/ServicesPanel';
import { ServicesItemPanel } from '@/components/admin/panels/ServicesItemPanel';
import { ServicesModuleList } from '@/components/admin/panels/ServicesModuleList';
import { ConditionsPanel } from '@/components/admin/panels/ConditionsPanel';
import { ConditionsModuleList } from '@/components/admin/panels/ConditionsModuleList';
import { CaseStudiesModuleList } from '@/components/admin/panels/CaseStudiesModuleList';
import { SeoProgramsModuleList } from '@/components/admin/panels/SeoProgramsModuleList';
import { ItemJsonEditor } from '@/components/admin/panels/ItemJsonEditor';
import {
  ConditionCategoryItemPanel,
  ConditionItemPanel,
} from '@/components/admin/panels/ConditionsItemPanel';
import {
  CaseStudyCategoryItemPanel,
  CaseStudyItemPanel,
} from '@/components/admin/panels/CaseStudiesItemPanel';
import { CaseStudiesPanel } from '@/components/admin/panels/CaseStudiesPanel';
import { PostsPanel } from '@/components/admin/panels/PostsPanel';
import { PricingPanel } from '@/components/admin/panels/PricingPanel';
import { ContactNotificationPanel } from '@/components/admin/panels/ContactNotificationPanel';
import { SECTION_VARIANT_OPTIONS, SITE_SETTINGS_PATHS } from '@/components/admin/utils/editorConstants';
import { getPathValue, toTitleCase } from '@/components/admin/utils/editorHelpers';
import type { ThemePreset } from '@/lib/theme-presets';

interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
  publishAt?: string;
  status?: 'draft' | 'scheduled' | 'published';
  groupKey?: string;
}

interface ContentEditorProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
  initialFilePath?: string;
  fileFilter?:
    | 'all'
    | 'blog'
    | 'siteSettings'
    | 'services'
    | 'servicesItems'
    | 'conditions'
    | 'conditionsItems'
    | 'caseStudies'
    | 'caseStudiesItems'
    | 'seoPrograms';
  titleOverride?: string;
  basePath?: string;
}


export function ContentEditor({
  sites,
  selectedSiteId,
  selectedLocale,
  initialFilePath,
  fileFilter = 'all',
  titleOverride,
  basePath = '/admin/content',
}: ContentEditorProps) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [files, setFiles] = useState<ContentFileItem[]>([]);
  const [activeFile, setActiveFile] = useState<ContentFileItem | null>(null);
  const [content, setContent] = useState('');
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'form' | 'json'>('form');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageFieldPath, setImageFieldPath] = useState<string[] | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState<Record<string, boolean>>({});
  const [seoPopulating, setSeoPopulating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [blogActionLoading, setBlogActionLoading] = useState(false);
  const [blogServiceOptions, setBlogServiceOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [blogConditionOptions, setBlogConditionOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [activeServiceIndex, setActiveServiceIndex] = useState(-1);
  const [serviceItemJsonDraft, setServiceItemJsonDraft] = useState('');
  const [serviceItemJsonError, setServiceItemJsonError] = useState<string | null>(null);
  const [activeConditionCategoryIndex, setActiveConditionCategoryIndex] = useState(-1);
  const [activeConditionIndex, setActiveConditionIndex] = useState(-1);
  const [conditionsItemJsonDraft, setConditionsItemJsonDraft] = useState('');
  const [conditionsItemJsonError, setConditionsItemJsonError] = useState<string | null>(null);
  const [activeCaseStudyCategoryIndex, setActiveCaseStudyCategoryIndex] = useState(-1);
  const [activeCaseStudyIndex, setActiveCaseStudyIndex] = useState(-1);
  const [caseStudiesItemJsonDraft, setCaseStudiesItemJsonDraft] = useState('');
  const [caseStudiesItemJsonError, setCaseStudiesItemJsonError] = useState<string | null>(null);
  const [activeSeoLocation, setActiveSeoLocation] = useState('');

  const withThemeDefaults = (input: Record<string, any>) => {
    const next = JSON.parse(JSON.stringify(input || {}));
    next.shape = next.shape || {};
    next.shape.radius = typeof next.shape.radius === 'string' && next.shape.radius ? next.shape.radius : '8px';
    next.shape.shadow =
      typeof next.shape.shadow === 'string' && next.shape.shadow
        ? next.shape.shadow
        : '0 4px 20px rgba(0,0,0,0.08)';

    next.layout = next.layout || {};
    if (typeof next.layout.heroVariant !== 'string') next.layout.heroVariant = 'centered';
    if (typeof next.layout.featureVariant !== 'string') next.layout.featureVariant = 'grid';
    if (
      next.layout.spacingDensity !== 'compact' &&
      next.layout.spacingDensity !== 'comfortable' &&
      next.layout.spacingDensity !== 'spacious'
    ) {
      next.layout.spacingDensity = 'comfortable';
    }

    if (next._preset && typeof next._preset !== 'object') {
      next._preset = {};
    }
    return next;
  };
  const filesTitle =
    fileFilter === 'blog'
      ? 'Blog Posts'
      : fileFilter === 'siteSettings'
        ? 'Site Settings'
        : fileFilter === 'services'
          ? 'Services'
          : fileFilter === 'servicesItems'
            ? 'Services'
          : fileFilter === 'conditions'
            ? 'Conditions'
            : fileFilter === 'conditionsItems'
              ? 'Conditions'
            : fileFilter === 'caseStudies'
              ? 'Case Studies'
            : fileFilter === 'caseStudiesItems'
              ? 'Case Studies'
            : fileFilter === 'seoPrograms'
              ? 'SEO Pages'
        : 'Files';
  const FILE_FILTER_PATHS: Record<
    | 'services'
    | 'servicesItems'
    | 'conditions'
    | 'conditionsItems'
    | 'caseStudies'
    | 'caseStudiesItems',
    string[]
  > = {
    services: ['pages/services.json', 'pages/services.layout.json'],
    servicesItems: ['pages/services.json', 'pages/services.layout.json'],
    conditions: ['pages/conditions.json', 'pages/conditions.layout.json'],
    conditionsItems: ['pages/conditions.json', 'pages/conditions.layout.json'],
    caseStudies: ['pages/case-studies.json', 'pages/case-studies.layout.json'],
    caseStudiesItems: ['pages/case-studies.json', 'pages/case-studies.layout.json'],
  };
  const isBlogManagedPath = (value?: string | null) =>
    typeof value === 'string' &&
    (value.startsWith('blog/') || value.startsWith('blog-scheduled/'));
  const isSeoProgramPath = (value?: string | null) =>
    typeof value === 'string' && !value.includes('/') && !value.endsWith('.json');
  const isServicesItemsMode = fileFilter === 'servicesItems';
  const isConditionsItemsMode = fileFilter === 'conditionsItems';
  const isCaseStudiesItemsMode = fileFilter === 'caseStudiesItems';
  const isSeoProgramsMode = fileFilter === 'seoPrograms';

  const site = useMemo(
    () => sites.find((item) => item.id === siteId),
    [sites, siteId]
  );

  useEffect(() => {
    if (!site) return;
    if (!site.supportedLocales.includes(locale)) {
      setLocale(site.defaultLocale);
    }
  }, [site, locale]);

  useEffect(() => {
    if (!siteId || !locale) return;
    const params = new URLSearchParams({ siteId, locale });
    router.replace(`${basePath}?${params.toString()}`);
  }, [router, siteId, locale, basePath]);

  const loadFiles = async (preferredPath?: string) => {
    if (!siteId || !locale) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/content/files?siteId=${siteId}&locale=${locale}`
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load files');
      }
      const payload = await response.json();
      let nextFiles: ContentFileItem[] = payload.files || [];
      if (fileFilter === 'blog') {
        nextFiles = nextFiles.filter((file) => isBlogManagedPath(file.path));
        nextFiles = [...nextFiles].sort((a, b) => {
          const aDate = a.publishAt || a.publishDate || '';
          const bDate = b.publishAt || b.publishDate || '';
          return bDate.localeCompare(aDate);
        });
      } else if (fileFilter === 'siteSettings') {
        nextFiles = nextFiles.filter((file) => SITE_SETTINGS_PATHS.has(file.path));
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      } else if (
        fileFilter === 'services' ||
        fileFilter === 'servicesItems' ||
        fileFilter === 'conditions' ||
        fileFilter === 'conditionsItems' ||
        fileFilter === 'caseStudies' ||
        fileFilter === 'caseStudiesItems'
      ) {
        const allowedPaths = new Set(FILE_FILTER_PATHS[fileFilter]);
        nextFiles = nextFiles.filter((file) => allowedPaths.has(file.path));
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      } else if (fileFilter === 'seoPrograms') {
        nextFiles = nextFiles.filter((file) => isSeoProgramPath(file.path));
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      } else {
        const moduleManagedPaths = new Set([
          ...FILE_FILTER_PATHS.servicesItems,
          ...FILE_FILTER_PATHS.conditions,
          ...FILE_FILTER_PATHS.caseStudies,
        ]);
        nextFiles = nextFiles.filter(
          (file) =>
            !isBlogManagedPath(file.path) &&
            !isSeoProgramPath(file.path) &&
            !SITE_SETTINGS_PATHS.has(file.path) &&
            !moduleManagedPaths.has(file.path)
        );
        nextFiles = [...nextFiles].sort((a, b) => a.label.localeCompare(b.label));
      }
      setFiles(nextFiles);
      if (preferredPath) {
        const matched = nextFiles.find((file) => file.path === preferredPath);
        setActiveFile(matched || nextFiles[0] || null);
      } else {
        setActiveFile(nextFiles[0] || null);
      }
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(initialFilePath);
  }, [siteId, locale, initialFilePath, fileFilter]);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setStatus(null);
    fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`
    )
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || 'Failed to load content');
        }
        return response.json();
      })
      .then((payload) => {
        const nextContent = payload.content || '';
        let parsedForForm: Record<string, any>;
        try {
          parsedForForm = JSON.parse(nextContent);
          if (activeFile?.path === 'theme.json') {
            parsedForForm = withThemeDefaults(parsedForForm);
            setContent(JSON.stringify(parsedForForm, null, 2));
          } else if (activeFile?.path === 'pages/about.json') {
            parsedForForm = normalizeAboutFormData(parsedForForm);
            setContent(JSON.stringify(parsedForForm, null, 2));
          } else {
            setContent(nextContent);
          }
          setFormData(parsedForForm);
        } catch (error) {
          setContent(nextContent);
          setFormData(null);
        }
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setLoading(false));
  }, [activeFile, siteId, locale]);

  useEffect(() => {
    if (!activeFile) return;
    if (isBlogManagedPath(activeFile.path)) {
      loadBlogLinkOptions();
    }
  }, [activeFile, siteId, locale]);

  const handleSave = async () => {
    setStatus(null);
    if (!activeFile) return;
    if (isServicesItemSelected && activeTab === 'json' && serviceItemJsonError) {
      setStatus('Invalid service item JSON. Please fix before saving.');
      return;
    }
    if (
      (isConditionCategorySelected || isConditionItemSelected) &&
      activeTab === 'json' &&
      conditionsItemJsonError
    ) {
      setStatus('Invalid condition JSON. Please fix before saving.');
      return;
    }
    if (
      (isCaseStudyCategorySelected || isCaseStudyItemSelected) &&
      activeTab === 'json' &&
      caseStudiesItemJsonError
    ) {
      setStatus('Invalid case study JSON. Please fix before saving.');
      return;
    }

    const setPathValue = (source: Record<string, any>, path: string[], value: any) => {
      let cursor: any = source;
      path.forEach((key, index) => {
        if (index === path.length - 1) {
          cursor[key] = value;
          return;
        }
        cursor[key] = cursor[key] ?? {};
        cursor = cursor[key];
      });
    };

    let nextFormData = formData ? JSON.parse(JSON.stringify(formData)) : null;
    if (activeTab === 'json' && isServicesItemSelected) {
      try {
        const parsed = JSON.parse(serviceItemJsonDraft);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setStatus('Service item JSON must be an object.');
          return;
        }
        if (!nextFormData) {
          setStatus('Form data is unavailable. Please reload and try again.');
          return;
        }
        setPathValue(nextFormData, ['servicesList', 'items', String(activeServiceIndex)], parsed);
      } catch (error) {
        setStatus('Invalid service item JSON. Please fix before saving.');
        return;
      }
    }
    if (activeTab === 'json' && (isConditionCategorySelected || isConditionItemSelected)) {
      try {
        const parsed = JSON.parse(conditionsItemJsonDraft);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setStatus('Condition JSON must be an object.');
          return;
        }
        if (!nextFormData) {
          setStatus('Form data is unavailable. Please reload and try again.');
          return;
        }
        if (isConditionCategorySelected) {
          setPathValue(nextFormData, ['categories', String(activeConditionCategoryIndex)], parsed);
        } else {
          setPathValue(nextFormData, ['conditions', String(activeConditionIndex)], parsed);
        }
      } catch (error) {
        setStatus('Invalid condition JSON. Please fix before saving.');
        return;
      }
    }
    if (activeTab === 'json' && (isCaseStudyCategorySelected || isCaseStudyItemSelected)) {
      try {
        const parsed = JSON.parse(caseStudiesItemJsonDraft);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          setStatus('Case study JSON must be an object.');
          return;
        }
        if (!nextFormData) {
          setStatus('Form data is unavailable. Please reload and try again.');
          return;
        }
        if (isCaseStudyCategorySelected) {
          setPathValue(nextFormData, ['categories', String(activeCaseStudyCategoryIndex)], parsed);
        } else {
          setPathValue(nextFormData, ['caseStudies', String(activeCaseStudyIndex)], parsed);
        }
      } catch (error) {
        setStatus('Invalid case study JSON. Please fix before saving.');
        return;
      }
    }
    let parsedContent: Record<string, any>;
    const isItemJsonMode =
      isServicesItemSelected ||
      isConditionCategorySelected ||
      isConditionItemSelected ||
      isCaseStudyCategorySelected ||
      isCaseStudyItemSelected;
    const isRawJsonEditing = activeTab === 'json' && !isItemJsonMode;
    if (isRawJsonEditing) {
      try {
        parsedContent = JSON.parse(content);
        if (activeFile.path === 'theme.json') {
          parsedContent = withThemeDefaults(parsedContent);
        }
        setFormData(parsedContent);
      } catch (error) {
        setStatus('Invalid JSON. Please fix before saving.');
        return;
      }
    } else {
      if (!nextFormData) {
        setStatus('Form data is unavailable. Please reload and try again.');
        return;
      }
      parsedContent = nextFormData;
      if (activeFile.path === 'theme.json') {
        parsedContent = withThemeDefaults(parsedContent);
      }
      setFormData(parsedContent);
    }

    if (activeFile.path === 'pages/about.json' && parsedContent && typeof parsedContent === 'object') {
      parsedContent = finalizeAboutFormForSave(parsedContent);
      setFormData(parsedContent);
    }

    let contentToSave = JSON.stringify(parsedContent, null, 2);
    if (
      activeFile.path === 'pages/services.json' &&
      parsedContent &&
      typeof parsedContent === 'object' &&
      Array.isArray(parsedContent.servicesList?.items)
    ) {
      // Keep servicesList.items as single source of truth.
      if ('services' in parsedContent) {
        delete parsedContent.services;
      }
      contentToSave = JSON.stringify(parsedContent, null, 2);
      setFormData(parsedContent);
      setContent(contentToSave);
    }

    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: activeFile.path,
        content: contentToSave,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Save failed');
      return;
    }

    const payload = await response.json();
    setStatus(payload.message || 'Saved');
  };

  const handleImport = async (
    mode: 'missing' | 'overwrite' = 'missing',
    options?: { dryRun?: boolean; force?: boolean; includePaths?: string[]; source?: string }
  ) => {
    if (mode === 'missing' && !options?.dryRun) {
      const scopedPaths = Array.isArray(options?.includePaths)
        ? options!.includePaths!.filter((value) => typeof value === 'string' && value.trim().length > 0)
        : [];
      if (scopedPaths.length === 0) {
        setStatus('Sync requires scoped file paths. Select a file and sync current file, or use section sync.');
        return null;
      }
    }
    setStatus(null);
    setLoading(true);
    setImporting(true);
    try {
      const response = await fetch('/api/admin/content/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          locale,
          mode,
          dryRun: Boolean(options?.dryRun),
          force: Boolean(options?.force),
          includePaths: options?.includePaths || undefined,
          source: options?.source || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Import failed');
      }
      if (options?.dryRun) {
        return payload;
      }
      const skipped = payload.skipped || 0;
      const imported = payload.imported || 0;
      setStatus(payload.message || (skipped
        ? `Imported ${imported} items. Skipped ${skipped} existing DB entries.`
        : `Imported ${imported} items from JSON.`));
      await loadFiles(activeFile?.path);
      return payload;
    } catch (error: any) {
      setStatus(error?.message || 'Import failed');
      return null;
    } finally {
      setLoading(false);
      setImporting(false);
    }
  };

  const handleOverwriteImport = async () => {
    const dryRun = await handleImport('overwrite', { dryRun: true });
    if (!dryRun) return;

    const conflicts = Array.isArray(dryRun.conflicts) ? dryRun.conflicts : [];
    if (conflicts.length > 0) {
      const conflictPreview = conflicts
        .slice(0, 5)
        .map((item: any) => `${item.locale}:${item.path}`)
        .join('\n');
      const forceConfirmed = window.confirm(
        `Safety check found ${conflicts.length} newer DB entries.\n\n` +
          `${conflictPreview}${conflicts.length > 5 ? '\n...' : ''}\n\n` +
          'Abort by default. Continue with FORCE overwrite anyway?'
      );
      if (!forceConfirmed) {
        setStatus('Overwrite cancelled due to newer DB entries.');
        return;
      }
      await handleImport('overwrite', { force: true, source: 'admin-overwrite-button' });
      return;
    }

    const confirmed = window.confirm(
      `Dry-run summary:\n` +
        `Create: ${dryRun.toCreate || 0}\n` +
        `Update: ${dryRun.toUpdate || 0}\n` +
        `Unchanged: ${dryRun.unchanged || 0}\n\n` +
        `${Array.isArray(dryRun.toUpdatePaths) && dryRun.toUpdatePaths.length > 0
          ? `Update paths:\n${dryRun.toUpdatePaths.slice(0, 8).join('\n')}${dryRun.toUpdatePaths.length > 8 ? '\n...' : ''}\n\n`
          : ''}` +
        `${Array.isArray(dryRun.toCreatePaths) && dryRun.toCreatePaths.length > 0
          ? `Create paths:\n${dryRun.toCreatePaths.slice(0, 8).join('\n')}${dryRun.toCreatePaths.length > 8 ? '\n...' : ''}\n\n`
          : ''}` +
        'Proceed with overwrite import?'
    );
    if (!confirmed) return;
    await handleImport('overwrite', { source: 'admin-overwrite-button' });
  };

  const handleCheckUpdateFromDb = async () => {
    const dryRun = await handleImport('overwrite', { dryRun: true });
    if (!dryRun) return;

    const updatePaths = Array.isArray(dryRun.toUpdatePaths) ? dryRun.toUpdatePaths : [];
    const createPaths = Array.isArray(dryRun.toCreatePaths) ? dryRun.toCreatePaths : [];
    const conflicts = Array.isArray(dryRun.conflicts) ? dryRun.conflicts : [];
    const conflictPaths = conflicts.map((item: any) => `${item.locale}:${item.path}`);

    const allDifferentPaths = Array.from(new Set([...updatePaths, ...createPaths, ...conflictPaths]));
    const preview = allDifferentPaths.slice(0, 20).join('\n');

    window.alert(
      `Check Update From DB\n\n` +
        `Different files: ${allDifferentPaths.length}\n` +
        `Create: ${createPaths.length}\n` +
        `Update: ${updatePaths.length}\n` +
        `DB newer conflicts: ${conflicts.length}\n\n` +
        `${allDifferentPaths.length > 0 ? `Paths:\n${preview}${allDifferentPaths.length > 20 ? '\n...' : ''}` : 'No differences found.'}`
    );

    setStatus(
      allDifferentPaths.length > 0
        ? `Found ${allDifferentPaths.length} files different from DB (create ${createPaths.length}, update ${updatePaths.length}, conflicts ${conflicts.length}).`
        : 'No differences between local JSON and DB.'
    );
  };

  const handleExport = async (options?: { includePaths?: string[] }) => {
    setStatus(null);
    setLoading(true);
    setExporting(true);
    try {
      const response = await fetch('/api/admin/content/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          locale,
          includePaths: options?.includePaths || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Export failed');
      }
      const details = [];
      if (typeof payload.backfilled === 'number') {
        details.push(`backfilled ${payload.backfilled}`);
      }
      if (typeof payload.backfillErrors === 'number' && payload.backfillErrors > 0) {
        details.push(`backfill errors ${payload.backfillErrors}`);
      }
      setStatus(
        `${payload.message || 'Export completed'}${details.length ? ` (${details.join(', ')})` : ''}`
      );
    } catch (error: any) {
      setStatus(error?.message || 'Export failed');
    } finally {
      setLoading(false);
      setExporting(false);
    }
  };

  const handleCreate = async () => {
    const isBlog = fileFilter === 'blog';
    const slug = window.prompt(
      isBlog ? 'New blog slug (example: my-post)' : 'New page slug (example: faq)'
    );
    if (!slug) return;
    const templateId =
      window.prompt(
        `Template: ${CONTENT_TEMPLATES.map((t) => t.id).join(', ')}`,
        CONTENT_TEMPLATES[0]?.id || 'basic'
      ) || CONTENT_TEMPLATES[0]?.id;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'create',
        slug,
        templateId,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Create failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleDuplicate = async () => {
    if (!activeFile) return;
    const isBlog = isBlogManagedPath(activeFile.path);
    const slug = window.prompt(
      isBlog
        ? 'Duplicate blog slug (example: my-post-copy)'
        : 'Duplicate page slug (example: faq-copy)'
    );
    if (!slug) return;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'duplicate',
        path: activeFile.path,
        slug,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Duplicate failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleFormat = () => {
    if (isServicesItemSelected && activeTab === 'json') {
      try {
        const parsed = JSON.parse(serviceItemJsonDraft);
        const formatted = JSON.stringify(parsed, null, 2);
        setServiceItemJsonDraft(formatted);
        setServiceItemJsonError(null);
        setStatus('Formatted');
      } catch (error) {
        setServiceItemJsonError('Invalid JSON');
        setStatus('Invalid service item JSON. Unable to format.');
      }
      return;
    }
    if ((isConditionCategorySelected || isConditionItemSelected) && activeTab === 'json') {
      try {
        const parsed = JSON.parse(conditionsItemJsonDraft);
        const formatted = JSON.stringify(parsed, null, 2);
        setConditionsItemJsonDraft(formatted);
        setConditionsItemJsonError(null);
        setStatus('Formatted');
      } catch (error) {
        setConditionsItemJsonError('Invalid JSON');
        setStatus('Invalid condition JSON. Unable to format.');
      }
      return;
    }
    if ((isCaseStudyCategorySelected || isCaseStudyItemSelected) && activeTab === 'json') {
      try {
        const parsed = JSON.parse(caseStudiesItemJsonDraft);
        const formatted = JSON.stringify(parsed, null, 2);
        setCaseStudiesItemJsonDraft(formatted);
        setCaseStudiesItemJsonError(null);
        setStatus('Formatted');
      } catch (error) {
        setCaseStudiesItemJsonError('Invalid JSON');
        setStatus('Invalid case study JSON. Unable to format.');
      }
      return;
    }
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setFormData(parsed);
      setStatus('Formatted');
    } catch (error) {
      setStatus('Invalid JSON. Unable to format.');
    }
  };

  const handleDelete = async () => {
    if (!activeFile) return;
    const confirmed = window.confirm(`Delete ${activeFile.path}? This cannot be undone.`);
    if (!confirmed) return;
    const response = await fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed');
      return;
    }
    await loadFiles();
  };

  const handleRunDuePublisher = async () => {
    if (!siteId) return;
    setBlogActionLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/blog/publish-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to run scheduled publisher');
      }
      setStatus(payload.message || 'Scheduled publisher completed.');
      await loadFiles(activeFile?.path);
    } catch (error: any) {
      setStatus(error?.message || 'Failed to run scheduled publisher');
    } finally {
      setBlogActionLoading(false);
    }
  };

  const handleWeeklyAutoSchedule = async () => {
    if (!siteId) return;
    const startDate = window.prompt('First publish date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10));
    if (!startDate) return;
    const intervalInput = window.prompt('Days between posts', '7');
    const intervalDays = Number(intervalInput || '7');
    if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
      setStatus('Interval must be a positive number of days.');
      return;
    }
    const onlyDrafts = window.confirm('Schedule only posts currently in draft status?\n\nOK = draft only\nCancel = schedule all blog posts in the series');
    setBlogActionLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/blog/schedule-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          locales: site?.supportedLocales || ['en', 'zh'],
          startDate,
          intervalDays,
          onlyDrafts,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to schedule weekly article series');
      }
      setStatus(payload.message || 'Weekly blog series scheduled.');
      await loadFiles(activeFile?.path);
    } catch (error: any) {
      setStatus(error?.message || 'Failed to schedule weekly article series');
    } finally {
      setBlogActionLoading(false);
    }
  };

  const loadBlogLinkOptions = async () => {
    if (!siteId || !locale) return;
    try {
      const [servicesRes, conditionsRes] = await Promise.all([
        fetch(
          `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
            'pages/services.json'
          )}`
        ),
        fetch(
          `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
            'pages/conditions.json'
          )}`
        ),
      ]);
      const [servicesPayload, conditionsPayload] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : Promise.resolve(null),
        conditionsRes.ok ? conditionsRes.json() : Promise.resolve(null),
      ]);

      const servicesData = servicesPayload?.content
        ? JSON.parse(servicesPayload.content)
        : null;
      const conditionsData = conditionsPayload?.content
        ? JSON.parse(conditionsPayload.content)
        : null;

      const serviceItems = servicesData?.servicesList?.items || servicesData?.services || [];
      const servicesOptions = Array.isArray(serviceItems)
        ? serviceItems
            .map((service: any) => ({
              id: String(service?.id || ''),
              title: String(service?.title || service?.name || ''),
            }))
            .filter((item: any) => item.id && item.title)
        : [];
      const conditionsOptions = Array.isArray(conditionsData?.conditions)
        ? conditionsData.conditions
            .map((condition: any) => ({
              id: String(condition?.id || ''),
              title: String(condition?.title || condition?.name || ''),
            }))
            .filter((item: any) => item.id && item.title)
        : [];

      setBlogServiceOptions(servicesOptions);
      setBlogConditionOptions(conditionsOptions);
    } catch (error) {
      setBlogServiceOptions([]);
      setBlogConditionOptions([]);
    }
  };

  const getPreviewPath = () => {
    if (!activeFile) return `/${locale}`;
    if (activeFile.path.startsWith('pages/')) {
      const slug = activeFile.path.replace('pages/', '').replace('.json', '');
      if (slug === 'home') return `/${locale}`;
      return `/${locale}/${slug}`;
    }
    if (!activeFile.path.includes('/') && !activeFile.path.endsWith('.json')) {
      return `/${locale}/${activeFile.path}`;
    }
    return `/${locale}`;
  };

  const updateFormValue = (path: string[], value: any) => {
    if (!formData) return;
    const next = { ...formData };
    let cursor: any = next;
    path.forEach((key, index) => {
      if (index === path.length - 1) {
        cursor[key] = value;
      } else {
        cursor[key] = cursor[key] ?? {};
        cursor = cursor[key];
      }
    });
    setFormData(next);
  };

  const applyThemePreset = (preset: ThemePreset) => {
    const nextTheme = JSON.parse(JSON.stringify(preset));
    setFormData(nextTheme);
    setContent(JSON.stringify(nextTheme, null, 2));
    setActiveTab('form');
    setStatus(`Applied theme preset: ${preset._preset.name}. Click Save to persist.`);
  };

  const openImagePicker = (path: string[]) => {
    setImageFieldPath(path);
    setShowImagePicker(true);
  };

  const handleImageSelect = (url: string) => {
    if (!imageFieldPath) return;
    updateFormValue(imageFieldPath, url);
  };

  const toggleMarkdownPreview = (key: string) => {
    setMarkdownPreview((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const getPathValueLocal = (path: string[]) =>
    getPathValue(formData, path);

  const renderColorField = (label: string, path: string[]) => {
    const value = String(getPathValueLocal(path) || '');
    return (
      <div className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
        <div>
          <label className="block text-xs text-gray-500">{label}</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={value}
            onChange={(event) => updateFormValue(path, event.target.value)}
            placeholder="#000000"
          />
        </div>
        <input
          type="color"
          className="mt-6 h-10 w-10 rounded-md border border-gray-200"
          value={value || '#000000'}
          onChange={(event) => updateFormValue(path, event.target.value)}
          aria-label={`${label} color`}
        />
      </div>
    );
  };

  const parsePrimitiveInput = (raw: string, current: any) => {
    if (typeof current === 'number') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : current;
    }
    return raw;
  };

  const setValueAtPath = (path: string[], value: any) => {
    updateFormValue(path, value);
  };

  const addArrayItemAtPath = (path: string[]) => {
    if (!formData) return;
    const current = getPathValue(formData, path);
    const list = Array.isArray(current) ? [...current] : [];
    const first = list[0];
    let nextValue: any = '';
    if (typeof first === 'number') nextValue = 0;
    else if (typeof first === 'boolean') nextValue = false;
    else if (first && typeof first === 'object' && !Array.isArray(first)) nextValue = {};
    else if (Array.isArray(first)) nextValue = [];
    list.push(nextValue);
    setValueAtPath(path, list);
  };

  const removeArrayItemAtPath = (path: string[], index: number) => {
    if (!formData) return;
    const current = getPathValue(formData, path);
    if (!Array.isArray(current)) return;
    const list = [...current];
    list.splice(index, 1);
    setValueAtPath(path, list);
  };

  const renderGenericFormNode = (value: any, path: string[] = [], label = ''): any => {
    const key = path.join('.') || 'root';
    const title = label || (path[path.length - 1] ? toTitleCase(path[path.length - 1]) : 'Root');

    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-gray-500">{title}</label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={() => addArrayItemAtPath(path)}
            >
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={`${key}.${index}`} className="rounded-md border border-gray-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Item {index + 1}</div>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => removeArrayItemAtPath(path, index)}
                  >
                    Remove
                  </button>
                </div>
                {renderGenericFormNode(item, [...path, String(index)], '')}
              </div>
            ))}
            {value.length === 0 && (
              <div className="text-xs text-gray-500">No items. Click Add Item.</div>
            )}
          </div>
        </div>
      );
    }

    if (value && typeof value === 'object') {
      return (
        <div key={key} className="space-y-3">
          {label ? <div className="text-sm font-medium text-gray-800">{title}</div> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(value).map(([childKey, childValue]) => (
              <div key={`${key}.${childKey}`} className={childValue && typeof childValue === 'object' ? 'md:col-span-2' : ''}>
                {renderGenericFormNode(childValue, [...path, childKey], toTitleCase(childKey))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => setValueAtPath(path, event.target.checked)}
          />
          {title}
        </label>
      );
    }

    const stringValue = value == null ? '' : String(value);
    const useTextarea = typeof value === 'string' && stringValue.length > 80;
    return (
      <div key={key}>
        <label className="block text-xs text-gray-500">{title}</label>
        {useTextarea ? (
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={3}
            value={stringValue}
            onChange={(event) => setValueAtPath(path, parsePrimitiveInput(event.target.value, value))}
          />
        ) : (
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={stringValue}
            onChange={(event) => setValueAtPath(path, parsePrimitiveInput(event.target.value, value))}
          />
        )}
      </div>
    );
  };

  const isSeoFile = activeFile?.path === 'seo.json';
  const isSiteInfoFile = activeFile?.path === 'site.json';
  const isBlogPostFile = isBlogManagedPath(activeFile?.path);
  const isHeaderFile = activeFile?.path === 'header.json';
  const isThemeFile = activeFile?.path === 'theme.json';
  const isHomePageFile = activeFile?.path === 'pages/home.json';
  const isContactPageFile = activeFile?.path === 'pages/contact.json';
  const isPricingPageFile = activeFile?.path === 'pages/pricing.json';
  const isConditionsPageFile = activeFile?.path === 'pages/conditions.json';
  const isCaseStudiesPageFile = activeFile?.path === 'pages/case-studies.json';
  const allowCreateOrDuplicate =
    fileFilter !== 'siteSettings' &&
    !isServicesItemsMode &&
    !isConditionsItemsMode &&
    !isCaseStudiesItemsMode &&
    !isSeoProgramsMode;
  const serviceItems = Array.isArray(formData?.servicesList?.items)
    ? formData.servicesList.items
    : [];
  const servicesPageFile = files.find((file) => file.path === 'pages/services.json') || null;
  const servicesLayoutFile =
    files.find((file) => file.path === 'pages/services.layout.json') || null;
  const isServicesPageFileActive = activeFile?.path === 'pages/services.json';
  const isServicesLayoutFileActive = activeFile?.path === 'pages/services.layout.json';
  const isServicesItemSelected =
    isServicesItemsMode && isServicesPageFileActive && activeServiceIndex >= 0;
  const isServicesPageSettingsSelected =
    isServicesItemsMode && isServicesPageFileActive && activeServiceIndex === -1;
  const showGlobalPanels = !isServicesItemsMode || isServicesPageSettingsSelected;
  const selectedService =
    isServicesItemsMode && isServicesPageFileActive && activeServiceIndex >= 0
      ? serviceItems[activeServiceIndex]
      : null;
  const conditionItems = Array.isArray(formData?.conditions) ? formData.conditions : [];
  const conditionsPageFile = files.find((file) => file.path === 'pages/conditions.json') || null;
  const conditionsLayoutFile =
    files.find((file) => file.path === 'pages/conditions.layout.json') || null;
  const isConditionsPageFileActive = activeFile?.path === 'pages/conditions.json';
  const isConditionsLayoutFileActive = activeFile?.path === 'pages/conditions.layout.json';
  const isConditionCategorySelected =
    isConditionsItemsMode && isConditionsPageFileActive && activeConditionCategoryIndex >= 0;
  const isConditionItemSelected =
    isConditionsItemsMode && isConditionsPageFileActive && activeConditionIndex >= 0;
  const isConditionsPageSettingsSelected =
    isConditionsItemsMode &&
    isConditionsPageFileActive &&
    activeConditionCategoryIndex === -1 &&
    activeConditionIndex === -1;
  const selectedConditionCategory = isConditionCategorySelected
    ? (formData?.categories?.[activeConditionCategoryIndex] ?? null)
    : null;
  const selectedConditionItem = isConditionItemSelected
    ? conditionItems[activeConditionIndex]
    : null;
  const showConditionsGlobalPanels = !isConditionsItemsMode || isConditionsPageSettingsSelected;
  const caseStudyItems = Array.isArray(formData?.caseStudies) ? formData.caseStudies : [];
  const caseStudiesPageFile =
    files.find((file) => file.path === 'pages/case-studies.json') || null;
  const caseStudiesLayoutFile =
    files.find((file) => file.path === 'pages/case-studies.layout.json') || null;
  const isCaseStudiesPageFileActive = activeFile?.path === 'pages/case-studies.json';
  const isCaseStudiesLayoutFileActive = activeFile?.path === 'pages/case-studies.layout.json';
  const isSeoPageFileActive = isSeoProgramPath(activeFile?.path);
  const isCaseStudyCategorySelected =
    isCaseStudiesItemsMode && isCaseStudiesPageFileActive && activeCaseStudyCategoryIndex >= 0;
  const isCaseStudyItemSelected =
    isCaseStudiesItemsMode && isCaseStudiesPageFileActive && activeCaseStudyIndex >= 0;
  const isCaseStudiesPageSettingsSelected =
    isCaseStudiesItemsMode &&
    isCaseStudiesPageFileActive &&
    activeCaseStudyCategoryIndex === -1 &&
    activeCaseStudyIndex === -1;
  const selectedCaseStudyCategory = isCaseStudyCategorySelected
    ? (formData?.categories?.[activeCaseStudyCategoryIndex] ?? null)
    : null;
  const selectedCaseStudyItem = isCaseStudyItemSelected
    ? caseStudyItems[activeCaseStudyIndex]
    : null;
  const inferSeoLocationFromFile = (file: ContentFileItem) => {
    if (typeof file.groupKey === 'string' && file.groupKey.trim()) {
      return file.groupKey.trim().toLowerCase();
    }
    const slug = file.path.trim().toLowerCase();
    const parts = slug.split('-');
    if (parts.length >= 2) {
      const maybeState = parts[parts.length - 1];
      const maybeCity = parts[parts.length - 2];
      if (/^[a-z]{2}$/.test(maybeState) && /^[a-z0-9]+$/.test(maybeCity)) {
        return `${maybeCity}-${maybeState}`;
      }
    }
    const chinesePrefix = file.path.match(/^([\u4e00-\u9fff]{2,4})/u)?.[1];
    return chinesePrefix || 'default';
  };
  const seoProgramFiles = isSeoProgramsMode ? files.filter((file) => isSeoProgramPath(file.path)) : [];
  const seoLocations = useMemo(() => {
    const unique = new Set<string>();
    seoProgramFiles.forEach((file) => {
      const key = inferSeoLocationFromFile(file);
      if (key) unique.add(key);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [seoProgramFiles]);
  const selectedSeoLocation = activeSeoLocation || seoLocations[0] || '';
  const seoPagesForSelectedLocation = useMemo(
    () =>
      seoProgramFiles
        .filter((file) => inferSeoLocationFromFile(file) === selectedSeoLocation)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [seoProgramFiles, selectedSeoLocation]
  );
  const showCaseStudiesGlobalPanels =
    !isCaseStudiesItemsMode || isCaseStudiesPageSettingsSelected;
  const showSharedPanels =
    showGlobalPanels && showConditionsGlobalPanels && showCaseStudiesGlobalPanels && !isSeoPageFileActive;
  const scopedActionPaths = useMemo(() => {
    if (fileFilter === 'services' || fileFilter === 'servicesItems') {
      return ['pages/services.json', 'pages/services.layout.json'];
    }
    if (fileFilter === 'conditions' || fileFilter === 'conditionsItems') {
      return ['pages/conditions.json', 'pages/conditions.layout.json'];
    }
    if (fileFilter === 'caseStudies' || fileFilter === 'caseStudiesItems') {
      return ['pages/case-studies.json', 'pages/case-studies.layout.json'];
    }
    if (fileFilter === 'blog') {
      return files.filter((file) => isBlogManagedPath(file.path)).map((file) => file.path);
    }
    if (fileFilter === 'seoPrograms') {
      return files.filter((file) => isSeoProgramPath(file.path)).map((file) => file.path);
    }
    return [] as string[];
  }, [fileFilter, files]);
  const hasScopedActions = scopedActionPaths.length > 0;
  const scopeLabel = hasScopedActions
    ? fileFilter === 'services' || fileFilter === 'servicesItems'
      ? 'Services'
      : fileFilter === 'conditions' || fileFilter === 'conditionsItems'
        ? 'Conditions'
        : fileFilter === 'caseStudies' || fileFilter === 'caseStudiesItems'
          ? 'Case Studies'
          : fileFilter === 'blog'
            ? 'Blog Posts'
            : fileFilter === 'seoPrograms'
              ? 'SEO Pages'
            : 'Current Section'
    : 'Current Section';

  useEffect(() => {
    if (!isSeoProgramsMode) return;
    if (seoLocations.length === 0) {
      if (activeSeoLocation) setActiveSeoLocation('');
      return;
    }
    if (!activeSeoLocation || !seoLocations.includes(activeSeoLocation)) {
      setActiveSeoLocation(seoLocations[0]);
    }
  }, [isSeoProgramsMode, seoLocations, activeSeoLocation]);

  useEffect(() => {
    if (!isSeoProgramsMode || !isSeoPageFileActive || !activeFile) return;
    const locationKey = inferSeoLocationFromFile(activeFile);
    if (!activeSeoLocation && locationKey && locationKey !== activeSeoLocation) {
      setActiveSeoLocation(locationKey);
    }
  }, [isSeoProgramsMode, isSeoPageFileActive, activeFile, activeSeoLocation]);

  const handleSeoLocationSelect = (locationKey: string) => {
    setActiveSeoLocation(locationKey);
    const nextPages = seoProgramFiles
      .filter((file) => inferSeoLocationFromFile(file) === locationKey)
      .sort((a, b) => a.label.localeCompare(b.label));
    if (nextPages.length > 0) {
      setActiveFile(nextPages[0]);
      return;
    }
    if (isSeoPageFileActive) {
      setActiveFile(null);
    }
  };

  const saveSeoProgramFile = async (filePath: string, data: Record<string, any>) => {
    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: filePath,
        content: JSON.stringify(data, null, 2),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Save failed');
    }
    return payload as { message?: string };
  };

  const addSeoLocation = async () => {
    if (!isSeoProgramsMode) return;
    const locationInput = window.prompt(
      '请输入地点标识（示例: middletown-ny 或 法拉盛）'
    );
    if (!locationInput) return;
    const normalizedLocation = locationInput.trim().toLowerCase();
    if (!normalizedLocation) {
      setStatus('Invalid location key.');
      return;
    }
    const newSlug = `acupuncture-${normalizedLocation}`;
    if (seoProgramFiles.some((file) => file.path === newSlug)) {
      setStatus(`Location already exists: ${normalizedLocation}`);
      const existing = seoProgramFiles.find((file) => file.path === newSlug) || null;
      if (existing) setActiveFile(existing);
      setActiveSeoLocation(normalizedLocation);
      return;
    }
    const titleDefault = `${normalizedLocation}中医针灸`;
    const pageTitle = (window.prompt('请输入页面标题（中文）', titleDefault) || titleDefault).trim();
    const payload: Record<string, any> = {
      pageType: 'seo-local-landing',
      seo: {
        title: pageTitle,
        h1: pageTitle,
        description: `${pageTitle}页面，提供本地中医针灸服务介绍。`,
        canonicalUrl: `/${locale}/${newSlug}`,
        noindex: false,
        priority: 0.9,
        schema: ['LocalBusiness', 'Service', 'BreadcrumbList'],
      },
      hero: {
        h1: pageTitle,
        subheading: '',
        intro: `${pageTitle}，支持中文咨询与预约。`,
        ctaLabel: '预约首次就诊',
        ctaHref: `/${locale}/contact`,
        trustItems: [],
      },
      location: {
        heading: `访问${pageTitle}`,
        intro: '',
        ctaLabel: '预约就诊',
        ctaHref: `/${locale}/contact`,
        hoursLabel: '营业时间',
        mapEmbedUrl: '',
        nap: {
          name: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          phone: '',
          email: '',
        },
        hours: [],
      },
      services: { heading: '服务项目', items: [] },
      conditions: { heading: '常见适应症', intro: '', items: [] },
      faq: { heading: '常见问题', items: [] },
      whyChooseUs: { heading: '为什么选择我们', items: [], testimonial: null },
    };
    try {
      setLoading(true);
      const result = await saveSeoProgramFile(newSlug, payload);
      await loadFiles(newSlug);
      setActiveSeoLocation(normalizedLocation);
      setStatus(result.message || `Created SEO location: ${normalizedLocation}`);
    } catch (error: any) {
      setStatus(error?.message || 'Failed to create location.');
    } finally {
      setLoading(false);
    }
  };

  const addSeoProgramPage = async () => {
    if (!isSeoProgramsMode || !selectedSeoLocation) return;
    const prefixInput = window.prompt(
      '请输入页面主题 slug（示例: acupuncture-for-back-pain）'
    );
    if (!prefixInput) return;
    const normalizedPrefix = prefixInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-\u4e00-\u9fff]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!normalizedPrefix) {
      setStatus('Invalid page slug.');
      return;
    }
    const slug = `${normalizedPrefix}-${selectedSeoLocation}`;
    if (seoProgramFiles.some((file) => file.path === slug)) {
      setStatus(`SEO page already exists: ${slug}`);
      const existing = seoProgramFiles.find((file) => file.path === slug) || null;
      if (existing) setActiveFile(existing);
      return;
    }
    const titleDefault = `${selectedSeoLocation}中医针灸专题`;
    const pageTitle = (window.prompt('请输入页面标题（中文）', titleDefault) || titleDefault).trim();
    const payload: Record<string, any> = {
      pageType: 'seo-service',
      service: normalizedPrefix,
      seo: {
        title: pageTitle,
        h1: pageTitle,
        description: `${pageTitle}页面，提供疗法与适应症说明。`,
        canonicalUrl: `/${locale}/${slug}`,
        noindex: false,
        priority: 0.8,
        schema: ['LocalBusiness', 'Service', 'BreadcrumbList'],
      },
      hero: {
        h1: pageTitle,
        subheading: '',
        intro: `${pageTitle}，支持中文咨询与预约。`,
        ctaLabel: '预约首次就诊',
        ctaHref: `/${locale}/contact`,
        trustItems: [],
      },
      faq: { heading: '常见问题', items: [] },
      services: { heading: '相关服务', items: [] },
      conditions: { heading: '常见适应症', intro: '', items: [] },
      whyChooseUs: { heading: '为什么选择我们', items: [], testimonial: null },
    };
    try {
      setLoading(true);
      const result = await saveSeoProgramFile(slug, payload);
      await loadFiles(slug);
      setStatus(result.message || `Created SEO page: ${slug}`);
    } catch (error: any) {
      setStatus(error?.message || 'Failed to create SEO page.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelectedSeoPage = async () => {
    if (!isSeoProgramsMode || !isSeoPageFileActive || !activeFile) return;
    const confirmed = window.confirm(`Delete ${activeFile.path}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
          activeFile.path
        )}`,
        { method: 'DELETE' }
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Delete failed');
      }
      await loadFiles();
      setStatus(payload.message || 'SEO page deleted.');
    } catch (error: any) {
      setStatus(error?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelectedSeoLocation = async () => {
    if (!isSeoProgramsMode || !selectedSeoLocation) return;
    const targetFiles = seoProgramFiles.filter(
      (file) => inferSeoLocationFromFile(file) === selectedSeoLocation
    );
    if (targetFiles.length === 0) {
      setStatus('No SEO pages found for selected location.');
      return;
    }
    const confirmed = window.confirm(
      `Delete location "${selectedSeoLocation}" and ${targetFiles.length} SEO page(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const results = await Promise.all(
        targetFiles.map(async (file) => {
          const response = await fetch(
            `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
              file.path
            )}`,
            { method: 'DELETE' }
          );
          return response.ok;
        })
      );
      await loadFiles();
      const successCount = results.filter(Boolean).length;
      setStatus(`Deleted ${successCount}/${targetFiles.length} SEO page(s).`);
    } catch (error: any) {
      setStatus(error?.message || 'Failed to delete location.');
    } finally {
      setLoading(false);
    }
  };

  const variantSections = formData
    ? Object.entries(SECTION_VARIANT_OPTIONS).filter(
        ([key]) =>
          formData[key] &&
          typeof formData[key] === 'object' &&
          !Array.isArray(formData[key])
      )
    : [];
  const galleryCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
          icon: typeof category?.icon === 'string' ? category.icon : '',
          description: typeof category?.description === 'string' ? category.description : '',
          order: typeof category?.order === 'number' ? category.order : undefined,
        }))
        .filter((category: any) => category.id || category.name)
    : [];
  const caseStudyCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
        }))
        .filter((category: any) => category.id && category.name)
    : [];
  const categoryOrderValue = (category: any) => {
    const order = Number(category?.order);
    return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER;
  };
  const sortedConditionCategories = Array.isArray(formData?.categories)
    ? formData.categories
        .map((category: any, index: number) => ({ category, index }))
        .sort(
          (a, b) =>
            categoryOrderValue(a.category) - categoryOrderValue(b.category) ||
            a.index - b.index
        )
    : [];
  const conditionCategoryOptions = Array.isArray(formData?.categories)
    ? sortedConditionCategories
        .map(({ category }: any) => ({
          id: typeof category?.id === 'string' ? category.id : '',
          name: typeof category?.name === 'string' ? category.name : '',
        }))
        .filter((category: any) => category.id && category.name && category.id !== 'all')
    : [];
  const homePhotoFields = useMemo(() => {
    if (!isHomePageFile || !formData) return [] as Array<{ path: string[]; label: string }>;

    const fields: Array<{ path: string[]; label: string }> = [];
    const IMAGE_KEYS = new Set(['image', 'backgroundImage', 'beforeImage', 'afterImage', 'src']);
    const EXCLUDED_ROOT_KEYS = new Set(['menu', 'topBar', 'topbar']);
    const DISPLAY_KEYS = [
      'title',
      'name',
      'label',
      'condition',
      'businessName',
      'clinicName',
      'tagline',
      'text',
      'id',
      'slug',
    ];

    const getNodeDisplayLabel = (node: any, fallbackIndex?: number) => {
      if (!node || typeof node !== 'object') {
        return typeof fallbackIndex === 'number' ? `Item ${fallbackIndex + 1}` : '';
      }

      for (const key of DISPLAY_KEYS) {
        const value = node?.[key];
        if (typeof value === 'string' && value.trim()) {
          return key === 'id' || key === 'slug' ? toTitleCase(value) : value.trim();
        }
      }

      if (typeof fallbackIndex === 'number') {
        return `Item ${fallbackIndex + 1}`;
      }
      return '';
    };

    const collectFields = (node: any, path: string[] = [], contextHint = '') => {
      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          const itemHint = getNodeDisplayLabel(item, index);
          collectFields(item, [...path, String(index)], itemHint);
        });
        return;
      }

      if (!node || typeof node !== 'object') {
        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (path.length === 0 && EXCLUDED_ROOT_KEYS.has(key)) {
          return;
        }

        const nextPath = [...path, key];
        const isImageField = IMAGE_KEYS.has(key);

        if (isImageField && typeof value === 'string') {
          const sectionLabel = nextPath
            .filter((part) => !/^\d+$/.test(part))
            .map((part) => toTitleCase(part))
            .join(' > ');
          const localHint = getNodeDisplayLabel(node);
          const hint = localHint || contextHint;
          const label = hint ? `${sectionLabel} (${hint})` : sectionLabel;
          fields.push({ path: nextPath, label });
          return;
        }

        if (typeof value === 'object' && value !== null) {
          collectFields(value, nextPath, contextHint);
        }
      });
    };

    collectFields(formData);
    return fields;
  }, [isHomePageFile, formData]);

  const addSeoPage = () => {
    if (!formData) return;
    const slug = window.prompt('Page slug (example: services)');
    if (!slug) return;
    updateFormValue(['pages', slug], {
      title: '',
      description: '',
    });
  };

  const removeSeoPage = (slug: string) => {
    if (!formData) return;
    const next = { ...formData };
    if (next.pages && typeof next.pages === 'object') {
      const pages = { ...next.pages };
      delete pages[slug];
      next.pages = pages;
      setFormData(next);
    }
  };

  const addGalleryImage = () => {
    if (!formData) return;
    const images = Array.isArray(formData.images) ? [...formData.images] : [];
    const maxOrder = images.reduce((max: number, image: any) => {
      const order = typeof image?.order === 'number' ? image.order : 0;
      return Math.max(max, order);
    }, 0);
    images.push({
      id: `gallery-${Date.now()}`,
      src: '',
      alt: '',
      title: '',
      category: '',
      description: '',
      featured: false,
      order: maxOrder + 1,
    });
    updateFormValue(['images'], images);
  };

  const removeGalleryImage = (index: number) => {
    if (!formData || !Array.isArray(formData.images)) return;
    const images = [...formData.images];
    images.splice(index, 1);
    updateFormValue(['images'], images);
  };

  const addGalleryCategory = () => {
    if (!formData) return;
    const categories = Array.isArray(formData.categories) ? [...formData.categories] : [];
    const nextIndex = categories.length + 1;
    categories.push({
      id: `category-${nextIndex}`,
      name: '',
      icon: 'Image',
      description: '',
      order: nextIndex,
    });
    updateFormValue(['categories'], categories);
  };

  const removeGalleryCategory = (index: number) => {
    if (!formData || !Array.isArray(formData.categories)) return;
    const categories = [...formData.categories];
    const target = categories[index];
    categories.splice(index, 1);
    const next: Record<string, any> = { ...formData, categories };

    if (target?.id && Array.isArray(formData.images)) {
      const fallbackCategory =
        categories.find((category: any) => category?.id && category.id !== 'all')?.id || '';
      next.images = formData.images.map((image: any) => {
        if (image?.category === target.id) {
          return {
            ...image,
            category: fallbackCategory,
          };
        }
        return image;
      });
    }

    setFormData(next);
  };

  const addHeaderMenuItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.menu?.items) ? [...formData.menu.items] : [];
    items.push({ text: '', url: '' });
    updateFormValue(['menu', 'items'], items);
  };

  const removeHeaderMenuItem = (index: number) => {
    if (!formData || !Array.isArray(formData.menu?.items)) return;
    const items = [...formData.menu.items];
    items.splice(index, 1);
    updateFormValue(['menu', 'items'], items);
  };

  const addHeaderLanguage = () => {
    if (!formData) return;
    const languages = Array.isArray(formData.languages) ? [...formData.languages] : [];
    languages.push({ label: '', locale: '', url: '' });
    updateFormValue(['languages'], languages);
  };

  const removeHeaderLanguage = (index: number) => {
    if (!formData || !Array.isArray(formData.languages)) return;
    const languages = [...formData.languages];
    languages.splice(index, 1);
    updateFormValue(['languages'], languages);
  };

  const toggleSelection = (path: string[], value: string) => {
    if (!formData) return;
    const current = Array.isArray(getPathValue(formData, path))
      ? (getPathValue(formData, path) as string[])
      : [];
    const exists = current.includes(value);
    const next = exists ? current.filter((item) => item !== value) : [...current, value];
    updateFormValue(path, next);
  };

  const addConditionCategory = () => {
    if (!formData) return;
    const categories = Array.isArray(formData.categories) ? [...formData.categories] : [];
    categories.push({
      id: `category-${categories.length + 1}`,
      icon: 'Activity',
      name: '',
      subtitle: '',
      description: '',
      image: '',
      order: categories.length + 1,
    });
    updateFormValue(['categories'], categories);
    if (isConditionsItemsMode) {
      setActiveConditionCategoryIndex(categories.length - 1);
      setActiveConditionIndex(-1);
    }
  };

  const removeConditionCategory = (index: number) => {
    if (!formData || !Array.isArray(formData.categories)) return;
    const categories = [...formData.categories];
    const target = categories[index];
    categories.splice(index, 1);
    const next: Record<string, any> = { ...formData, categories };

    if (target?.id && Array.isArray(formData.conditions)) {
      const fallbackCategory =
        categories.find((category: any) => category?.id && category.id !== 'all')?.id || '';
      next.conditions = formData.conditions.map((condition: any) => {
        if (condition?.category === target.id) {
          return {
            ...condition,
            category: fallbackCategory,
          };
        }
        return condition;
      });
    }

    setFormData(next);
    if (isConditionsItemsMode) {
      setActiveConditionCategoryIndex((current) => {
        if (categories.length === 0) return -1;
        if (current > index) return current - 1;
        if (current >= categories.length) return categories.length - 1;
        return current;
      });
    }
  };

  const addConditionItem = () => {
    if (!formData) return;
    const list = Array.isArray(formData.conditions) ? [...formData.conditions] : [];
    const firstCategory = conditionCategoryOptions[0]?.id || '';
    list.push({
      id: `condition-${list.length + 1}`,
      title: '',
      category: firstCategory,
      icon: 'Activity',
      image: '',
      description: '',
      symptoms: [],
      tcmApproach: '',
      treatmentMethods: [],
      featured: false,
    });
    updateFormValue(['conditions'], list);
    if (isConditionsItemsMode) {
      setActiveConditionIndex(list.length - 1);
      setActiveConditionCategoryIndex(-1);
    }
  };

  const removeConditionItem = (index: number) => {
    if (!formData || !Array.isArray(formData.conditions)) return;
    const list = [...formData.conditions];
    list.splice(index, 1);
    updateFormValue(['conditions'], list);
    if (isConditionsItemsMode) {
      setActiveConditionIndex((current) => {
        if (list.length === 0) return -1;
        if (current > index) return current - 1;
        if (current >= list.length) return list.length - 1;
        return current;
      });
    }
  };

  const addCaseStudyCategory = () => {
    if (!formData) return;
    const categories = Array.isArray(formData.categories) ? [...formData.categories] : [];
    categories.push({
      id: `category-${categories.length + 1}`,
      icon: 'Activity',
      name: '',
    });
    updateFormValue(['categories'], categories);
    if (isCaseStudiesItemsMode) {
      setActiveCaseStudyCategoryIndex(categories.length - 1);
      setActiveCaseStudyIndex(-1);
    }
  };

  const removeCaseStudyCategory = (index: number) => {
    if (!formData || !Array.isArray(formData.categories)) return;
    const categories = [...formData.categories];
    const target = categories[index];
    categories.splice(index, 1);
    const next: Record<string, any> = { ...formData, categories };

    if (target?.id && Array.isArray(formData.caseStudies)) {
      const fallbackCategory =
        categories.find((category: any) => category?.id && category.id !== 'all')?.id || '';
      next.caseStudies = formData.caseStudies.map((item: any) => {
        if (item?.category === target.id) {
          return {
            ...item,
            category: fallbackCategory,
          };
        }
        return item;
      });
    }

    setFormData(next);
    if (isCaseStudiesItemsMode) {
      setActiveCaseStudyCategoryIndex((current) => {
        if (categories.length === 0) return -1;
        if (current > index) return current - 1;
        if (current >= categories.length) return categories.length - 1;
        return current;
      });
    }
  };

  const addCaseStudyItem = () => {
    if (!formData) return;
    const list = Array.isArray(formData.caseStudies) ? [...formData.caseStudies] : [];
    const firstCategory = caseStudyCategories.find((entry) => entry.id !== 'all')?.id || '';
    list.push({
      id: `case-${list.length + 1}`,
      condition: '',
      category: firstCategory,
      summary: '',
      image: '',
      beforeImage: '',
      afterImage: '',
    });
    updateFormValue(['caseStudies'], list);
    if (isCaseStudiesItemsMode) {
      setActiveCaseStudyIndex(list.length - 1);
      setActiveCaseStudyCategoryIndex(-1);
    }
  };

  const removeCaseStudyItem = (index: number) => {
    if (!formData || !Array.isArray(formData.caseStudies)) return;
    const list = [...formData.caseStudies];
    list.splice(index, 1);
    updateFormValue(['caseStudies'], list);
    if (isCaseStudiesItemsMode) {
      setActiveCaseStudyIndex((current) => {
        if (list.length === 0) return -1;
        if (current > index) return current - 1;
        if (current >= list.length) return list.length - 1;
        return current;
      });
    }
  };

  const addServicesListItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.servicesList?.items) ? [...formData.servicesList.items] : [];
    items.push({
      id: `service-${items.length + 1}`,
      icon: 'Syringe',
      order: items.length + 1,
      title: '',
      shortDescription: '',
      fullDescription: '',
      benefits: [],
      whatToExpect: '',
      image: '',
      featured: false,
    });
    updateFormValue(['servicesList', 'items'], items);
    if (isServicesItemsMode) {
      setActiveServiceIndex(items.length - 1);
    }
  };

  const removeServicesListItem = (index: number) => {
    if (!formData || !Array.isArray(formData.servicesList?.items)) return;
    const items = [...formData.servicesList.items];
    items.splice(index, 1);
    updateFormValue(['servicesList', 'items'], items);
    if (isServicesItemsMode) {
      setActiveServiceIndex((current) => {
        if (items.length === 0) return -1;
        if (current > index) return current - 1;
        if (current >= items.length) return items.length - 1;
        return current;
      });
    }
  };

  const deleteSelectedService = async () => {
    if (!isServicesPageFileActive || activeServiceIndex < 0 || !formData) return;
    const currentService = serviceItems[activeServiceIndex];
    const serviceName =
      currentService?.title || currentService?.id || `Service ${activeServiceIndex + 1}`;
    const confirmed = window.confirm(
      `Delete "${serviceName}"? This removes only this service item.`
    );
    if (!confirmed) return;

    const items = Array.isArray(formData.servicesList?.items) ? [...formData.servicesList.items] : [];
    items.splice(activeServiceIndex, 1);
    const next = {
      ...formData,
      servicesList: {
        ...(formData.servicesList || {}),
        items,
      },
    };

    setFormData(next);
    setActiveServiceIndex((current) => {
      if (items.length === 0) return -1;
      if (current >= items.length) return items.length - 1;
      return current;
    });

    let payloadToSave: Record<string, any> = JSON.parse(JSON.stringify(next));
    if ('services' in payloadToSave) {
      delete payloadToSave.services;
    }
    const contentToSave = JSON.stringify(payloadToSave, null, 2);

    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: 'pages/services.json',
        content: contentToSave,
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed to save');
      return;
    }
    const payload = await response.json();
    setStatus(payload.message || 'Service deleted and saved.');
  };

  const deleteSelectedCaseStudyCategory = async () => {
    if (!isCaseStudiesPageFileActive || activeCaseStudyCategoryIndex < 0 || !formData) return;
    const categories = Array.isArray(formData.categories) ? [...formData.categories] : [];
    const target = categories[activeCaseStudyCategoryIndex];
    if (target?.id === 'all') {
      setStatus('Cannot delete the "all" category.');
      return;
    }
    categories.splice(activeCaseStudyCategoryIndex, 1);
    const next: Record<string, any> = { ...formData, categories };
    if (target?.id && Array.isArray(formData.caseStudies)) {
      const fallbackCategory =
        categories.find((category: any) => category?.id && category.id !== 'all')?.id || '';
      next.caseStudies = formData.caseStudies.map((item: any) =>
        item?.category === target.id ? { ...item, category: fallbackCategory } : item
      );
    }
    setFormData(next);
    setActiveCaseStudyCategoryIndex((current) => {
      if (categories.length === 0) return -1;
      if (current >= categories.length) return categories.length - 1;
      return current;
    });
    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: 'pages/case-studies.json',
        content: JSON.stringify(next, null, 2),
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed to save');
      return;
    }
    const payload = await response.json();
    setStatus(payload.message || 'Category deleted and saved.');
  };

  const deleteSelectedCaseStudyItem = async () => {
    if (!isCaseStudiesPageFileActive || activeCaseStudyIndex < 0 || !formData) return;
    const list = Array.isArray(formData.caseStudies) ? [...formData.caseStudies] : [];
    list.splice(activeCaseStudyIndex, 1);
    const next = { ...formData, caseStudies: list };
    setFormData(next);
    setActiveCaseStudyIndex((current) => {
      if (list.length === 0) return -1;
      if (current >= list.length) return list.length - 1;
      return current;
    });
    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: 'pages/case-studies.json',
        content: JSON.stringify(next, null, 2),
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed to save');
      return;
    }
    const payload = await response.json();
    setStatus(payload.message || 'Case study deleted and saved.');
  };

  const addTrustBarItem = () => {
    if (!formData) return;
    const items = Array.isArray(formData.trustBar?.items) ? [...formData.trustBar.items] : [];
    items.push({
      icon: 'Shield',
      title: '',
      description: '',
    });
    updateFormValue(['trustBar', 'items'], items);
  };

  const removeTrustBarItem = (index: number) => {
    if (!formData || !Array.isArray(formData.trustBar?.items)) return;
    const items = [...formData.trustBar.items];
    items.splice(index, 1);
    updateFormValue(['trustBar', 'items'], items);
  };

  const addRelatedReadingSlug = () => {
    if (!formData) return;
    const slugs = Array.isArray(formData.relatedReading?.preferredSlugs)
      ? [...formData.relatedReading.preferredSlugs]
      : [];
    slugs.push('');
    updateFormValue(['relatedReading', 'preferredSlugs'], slugs);
  };

  const removeRelatedReadingSlug = (index: number) => {
    if (!formData || !Array.isArray(formData.relatedReading?.preferredSlugs)) return;
    const slugs = [...formData.relatedReading.preferredSlugs];
    slugs.splice(index, 1);
    updateFormValue(['relatedReading', 'preferredSlugs'], slugs);
  };

  const populateSeoFromHeroes = async () => {
    if (!formData) return;
    setSeoPopulating(true);
    setStatus(null);
    try {
      const pageFiles = files
        .filter((file) => file.path.startsWith('pages/'))
        .map((file) => ({
          path: file.path,
          slug: file.path.replace('pages/', '').replace('.json', ''),
        }));

      const results = await Promise.all(
        pageFiles.map(async (page) => {
          try {
            const response = await fetch(
              `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
                page.path
              )}`
            );
            if (!response.ok) {
              return null;
            }
            const payload = await response.json();
            const parsed = JSON.parse(payload.content || '{}');
            const hero = parsed?.hero;
            const title = hero?.title;
            const description = hero?.description || hero?.subtitle;
            if (!title && !description) {
              return null;
            }
            return { slug: page.slug, title, description };
          } catch (error) {
            return null;
          }
        })
      );

      const next = { ...formData };
      const pages = typeof next.pages === 'object' && next.pages ? { ...next.pages } : {};

      results.forEach((entry) => {
        if (!entry) return;
        if (entry.slug === 'home') {
          const currentHome = next.home || {};
          next.home = {
            title: currentHome.title || entry.title || '',
            description: currentHome.description || entry.description || '',
          };
          return;
        }

        const current = pages[entry.slug] || {};
        pages[entry.slug] = {
          title: current.title || entry.title || '',
          description: current.description || entry.description || '',
        };
      });

      next.pages = pages;
      setFormData(next);
      setStatus('SEO populated from hero sections.');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to populate SEO.');
    } finally {
      setSeoPopulating(false);
    }
  };

  useEffect(() => {
    if (!isServicesItemsMode || !isServicesPageFileActive) return;
    if (!serviceItems.length) {
      setActiveServiceIndex(-1);
      return;
    }
    if (activeServiceIndex >= serviceItems.length) {
      setActiveServiceIndex(serviceItems.length - 1);
    }
  }, [isServicesItemsMode, isServicesPageFileActive, serviceItems.length, activeServiceIndex]);

  useEffect(() => {
    if (!isServicesItemSelected || !selectedService) {
      setServiceItemJsonDraft('');
      setServiceItemJsonError(null);
      return;
    }
    setServiceItemJsonDraft(JSON.stringify(selectedService, null, 2));
    setServiceItemJsonError(null);
  }, [isServicesItemSelected, selectedService, activeServiceIndex]);

  useEffect(() => {
    if (!isConditionsItemsMode || !isConditionsPageFileActive) return;
    const categories = Array.isArray(formData?.categories) ? formData.categories : [];
    const conditions = Array.isArray(formData?.conditions) ? formData.conditions : [];
    if (activeConditionCategoryIndex >= categories.length) {
      setActiveConditionCategoryIndex(categories.length > 0 ? categories.length - 1 : -1);
    }
    if (activeConditionIndex >= conditions.length) {
      setActiveConditionIndex(conditions.length > 0 ? conditions.length - 1 : -1);
    }
  }, [
    isConditionsItemsMode,
    isConditionsPageFileActive,
    formData?.categories,
    formData?.conditions,
    activeConditionCategoryIndex,
    activeConditionIndex,
  ]);

  useEffect(() => {
    if (!isThemeFile && activeTab === 'presets') {
      setActiveTab('form');
    }
  }, [activeTab, isThemeFile]);

  useEffect(() => {
    if (!isCaseStudiesItemsMode || !isCaseStudiesPageFileActive) return;
    const categories = Array.isArray(formData?.categories) ? formData.categories : [];
    const items = Array.isArray(formData?.caseStudies) ? formData.caseStudies : [];
    if (activeCaseStudyCategoryIndex >= categories.length) {
      setActiveCaseStudyCategoryIndex(categories.length > 0 ? categories.length - 1 : -1);
    }
    if (activeCaseStudyIndex >= items.length) {
      setActiveCaseStudyIndex(items.length > 0 ? items.length - 1 : -1);
    }
  }, [
    isCaseStudiesItemsMode,
    isCaseStudiesPageFileActive,
    formData?.categories,
    formData?.caseStudies,
    activeCaseStudyCategoryIndex,
    activeCaseStudyIndex,
  ]);

  useEffect(() => {
    if (isConditionCategorySelected && selectedConditionCategory) {
      setConditionsItemJsonDraft(JSON.stringify(selectedConditionCategory, null, 2));
      setConditionsItemJsonError(null);
      return;
    }
    if (isConditionItemSelected && selectedConditionItem) {
      setConditionsItemJsonDraft(JSON.stringify(selectedConditionItem, null, 2));
      setConditionsItemJsonError(null);
      return;
    }
    setConditionsItemJsonDraft('');
    setConditionsItemJsonError(null);
  }, [
    isConditionCategorySelected,
    selectedConditionCategory,
    isConditionItemSelected,
    selectedConditionItem,
    activeConditionCategoryIndex,
    activeConditionIndex,
  ]);

  useEffect(() => {
    if (isCaseStudyCategorySelected && selectedCaseStudyCategory) {
      setCaseStudiesItemJsonDraft(JSON.stringify(selectedCaseStudyCategory, null, 2));
      setCaseStudiesItemJsonError(null);
      return;
    }
    if (isCaseStudyItemSelected && selectedCaseStudyItem) {
      setCaseStudiesItemJsonDraft(JSON.stringify(selectedCaseStudyItem, null, 2));
      setCaseStudiesItemJsonError(null);
      return;
    }
    setCaseStudiesItemJsonDraft('');
    setCaseStudiesItemJsonError(null);
  }, [
    isCaseStudyCategorySelected,
    selectedCaseStudyCategory,
    isCaseStudyItemSelected,
    selectedCaseStudyItem,
    activeCaseStudyCategoryIndex,
    activeCaseStudyIndex,
  ]);

  useEffect(() => {
    const isItemJsonMode =
      isServicesItemSelected ||
      isConditionCategorySelected ||
      isConditionItemSelected ||
      isCaseStudyCategorySelected ||
      isCaseStudyItemSelected;
    if (activeTab !== 'json' || isItemJsonMode || !formData) return;
    setContent(JSON.stringify(formData, null, 2));
  }, [
    activeTab,
    formData,
    isServicesItemSelected,
    isConditionCategorySelected,
    isConditionItemSelected,
    isCaseStudyCategorySelected,
    isCaseStudyItemSelected,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {titleOverride || 'Content Editor'}
          </h1>
          <p className="text-sm text-gray-600">
            Select a site and locale to edit JSON content files.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500">Site</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
              }}
            >
              {sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Locale</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {(site?.supportedLocales || ['en']).map((item) => (
                <option key={item} value={item}>
                  {item === 'en' ? 'English' : item === 'zh' ? 'Chinese' : item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pt-4 sm:pt-0">
            {fileFilter === 'blog' && (
              <>
                <button
                  type="button"
                  onClick={handleWeeklyAutoSchedule}
                  disabled={blogActionLoading || loading}
                  className="px-3 py-2 rounded-md border border-blue-200 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                >
                  {blogActionLoading ? 'Working…' : 'Auto-Schedule Weekly'}
                </button>
                <button
                  type="button"
                  onClick={handleRunDuePublisher}
                  disabled={blogActionLoading || loading}
                  className="px-3 py-2 rounded-md border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                >
                  {blogActionLoading ? 'Working…' : 'Run Publisher Now'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (!activeFile?.path) {
                  setStatus('Select a file before syncing to DB.');
                  return;
                }
                const confirmed = window.confirm(
                  `Sync current file to DB for ${siteId} (${locale})?\n\nPath:\n${activeFile.path}\n\nOnly this file will be imported in missing mode.`
                );
                if (!confirmed) return;
                handleImport('missing', { includePaths: [activeFile.path] });
              }}
              disabled={!activeFile?.path || importing || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Sync Current File to DB'}
            </button>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `Run Check Update From DB for ${siteId} (${locale})?\n\nThis compares local JSON vs DB for the whole locale and shows a diff summary.`
                );
                if (!confirmed) return;
                handleCheckUpdateFromDb();
              }}
              disabled={importing || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Check Update From DB
            </button>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `Overwrite import for ${siteId} (${locale})?\n\nThis is a locale-wide write action and can replace DB content with local JSON. Continue?`
                );
                if (!confirmed) return;
                handleOverwriteImport();
              }}
              disabled={importing || loading}
              className="px-3 py-2 rounded-md border border-amber-200 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Overwrite Import'}
            </button>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `Export locale DB to JSON for ${siteId} (${locale})?\n\nThis applies to all files in the selected site + locale.`
                );
                if (!confirmed) return;
                handleExport();
              }}
              disabled={exporting || loading}
              className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export Locale JSON'}
            </button>
            {hasScopedActions && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Import section JSON for ${scopeLabel} (${siteId}, ${locale})?\n\nThis applies only to ${scopeLabel} files and imports missing DB entries.`
                    );
                    if (!confirmed) return;
                    handleImport('missing', { includePaths: scopedActionPaths });
                  }}
                  disabled={importing || loading}
                  className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {importing ? 'Importing…' : 'Import Section JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Export section JSON for ${scopeLabel} (${siteId}, ${locale})?\n\nThis applies only to ${scopeLabel} files and writes local JSON from DB.`
                    );
                    if (!confirmed) return;
                    handleExport({ includePaths: scopedActionPaths });
                  }}
                  disabled={exporting || loading}
                  className="px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {exporting ? 'Exporting…' : 'Export Section JSON'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-3">
        Overwrite Import is locale-wide. Sync Current File and section import/export are scoped.
      </p>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            {filesTitle}
          </div>
          {loading && files.length === 0 ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="space-y-2">
              {isServicesItemsMode && activeFile ? (
                <ServicesModuleList
                  servicesPageFile={servicesPageFile}
                  servicesLayoutFile={servicesLayoutFile}
                  isServicesPageSettingsSelected={isServicesPageSettingsSelected}
                  isServicesLayoutFileActive={isServicesLayoutFileActive}
                  isServicesPageFileActive={isServicesPageFileActive}
                  activeServiceIndex={activeServiceIndex}
                  serviceItems={serviceItems}
                  setActiveFile={(file) => setActiveFile(file as ContentFileItem | null)}
                  setActiveServiceIndex={setActiveServiceIndex}
                  addServicesListItem={addServicesListItem}
                  deleteSelectedService={deleteSelectedService}
                />
              ) : isConditionsItemsMode && activeFile ? (
                <ConditionsModuleList
                  conditionsPageFile={conditionsPageFile}
                  conditionsLayoutFile={conditionsLayoutFile}
                  isConditionsPageSettingsSelected={isConditionsPageSettingsSelected}
                  isConditionsLayoutFileActive={isConditionsLayoutFileActive}
                  isConditionsPageFileActive={isConditionsPageFileActive}
                  activeConditionCategoryIndex={activeConditionCategoryIndex}
                  activeConditionIndex={activeConditionIndex}
                  categories={Array.isArray(formData?.categories) ? formData.categories : []}
                  conditionItems={conditionItems}
                  setActiveFile={(file) => setActiveFile(file as ContentFileItem | null)}
                  setActiveConditionCategoryIndex={setActiveConditionCategoryIndex}
                  setActiveConditionIndex={setActiveConditionIndex}
                  addConditionCategory={addConditionCategory}
                  removeConditionCategory={removeConditionCategory}
                  addConditionItem={addConditionItem}
                  removeConditionItem={removeConditionItem}
                  setStatus={(message) => setStatus(message)}
                />
              ) : isCaseStudiesItemsMode && activeFile ? (
                <CaseStudiesModuleList
                  caseStudiesPageFile={caseStudiesPageFile}
                  caseStudiesLayoutFile={caseStudiesLayoutFile}
                  isCaseStudiesPageSettingsSelected={isCaseStudiesPageSettingsSelected}
                  isCaseStudiesLayoutFileActive={isCaseStudiesLayoutFileActive}
                  isCaseStudiesPageFileActive={isCaseStudiesPageFileActive}
                  activeCaseStudyCategoryIndex={activeCaseStudyCategoryIndex}
                  activeCaseStudyIndex={activeCaseStudyIndex}
                  categories={Array.isArray(formData?.categories) ? formData.categories : []}
                  caseStudies={caseStudyItems}
                  setActiveFile={(file) => setActiveFile(file as ContentFileItem | null)}
                  setActiveCaseStudyCategoryIndex={setActiveCaseStudyCategoryIndex}
                  setActiveCaseStudyIndex={setActiveCaseStudyIndex}
                  addCaseStudyCategory={addCaseStudyCategory}
                  deleteSelectedCaseStudyCategory={deleteSelectedCaseStudyCategory}
                  addCaseStudyItem={addCaseStudyItem}
                  deleteSelectedCaseStudyItem={deleteSelectedCaseStudyItem}
                  setStatus={(message) => setStatus(message)}
                />
              ) : isSeoProgramsMode ? (
                <SeoProgramsModuleList
                  locations={seoLocations}
                  selectedLocation={selectedSeoLocation}
                  pages={seoPagesForSelectedLocation}
                  activeFilePath={activeFile?.path}
                  onSelectLocation={handleSeoLocationSelect}
                  setActiveFile={(file) => setActiveFile(file as ContentFileItem | null)}
                  addLocation={addSeoLocation}
                  deleteSelectedLocation={deleteSelectedSeoLocation}
                  addPage={addSeoProgramPage}
                  deleteSelectedPage={deleteSelectedSeoPage}
                />
              ) : (
                files.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setActiveFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      activeFile?.id === file.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{file.label}</div>
                    <div className="text-xs opacity-70">{file.path}</div>
                    {fileFilter === 'blog' && (file.publishAt || file.publishDate || file.status) && (
                      <div className="mt-1 space-y-1 text-[11px] text-gray-500">
                        {file.status && (
                          <div className="uppercase tracking-wide">{file.status}</div>
                        )}
                        {(file.publishAt || file.publishDate) && (
                          <div>
                            {new Date(file.publishAt || file.publishDate || '').toLocaleDateString(
                              locale === 'zh' ? 'zh-CN' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
              {files.length === 0 && (
                <div className="text-sm text-gray-500">
                  {fileFilter === 'blog'
                    ? 'No blog posts found for this locale.'
                    : 'No content files found for this locale.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {isServicesItemsMode
                  ? isServicesLayoutFileActive
                    ? 'Services Layout'
                    : isServicesPageSettingsSelected
                    ? 'Services Page Settings'
                    : selectedService?.title || selectedService?.id || 'Select a service'
                  : isConditionsItemsMode
                    ? isConditionsLayoutFileActive
                      ? 'Conditions Layout'
                      : isConditionsPageSettingsSelected
                        ? 'Conditions Page Settings'
                        : isConditionCategorySelected
                          ? selectedConditionCategory?.name ||
                            selectedConditionCategory?.id ||
                            'Category'
                          : isConditionItemSelected
                            ? selectedConditionItem?.title || selectedConditionItem?.id || 'Condition'
                            : 'Select an item'
                  : isCaseStudiesItemsMode
                    ? isCaseStudiesLayoutFileActive
                      ? 'Case Studies Layout'
                      : isCaseStudiesPageSettingsSelected
                        ? 'Case Studies Page Settings'
                        : isCaseStudyCategorySelected
                          ? selectedCaseStudyCategory?.name ||
                            selectedCaseStudyCategory?.id ||
                            'Category'
                          : isCaseStudyItemSelected
                            ? selectedCaseStudyItem?.condition || selectedCaseStudyItem?.id || 'Case Study'
                            : 'Select an item'
                  : activeFile?.label || 'Select a file'}
              </div>
              <div className="text-xs text-gray-500">
                {isServicesItemsMode
                  ? isServicesLayoutFileActive
                    ? `${activeFile?.path || ''} · layout`
                    : isServicesPageSettingsSelected
                    ? `${activeFile?.path || ''} · page settings`
                    : `${activeFile?.path || ''} · item ${activeServiceIndex + 1}`
                  : isConditionsItemsMode
                    ? isConditionsLayoutFileActive
                      ? `${activeFile?.path || ''} · layout`
                      : isConditionsPageSettingsSelected
                        ? `${activeFile?.path || ''} · page settings`
                        : isConditionCategorySelected
                          ? `${activeFile?.path || ''} · category ${activeConditionCategoryIndex + 1}`
                          : isConditionItemSelected
                            ? `${activeFile?.path || ''} · condition ${activeConditionIndex + 1}`
                            : activeFile?.path
                  : isCaseStudiesItemsMode
                    ? isCaseStudiesLayoutFileActive
                      ? `${activeFile?.path || ''} · layout`
                      : isCaseStudiesPageSettingsSelected
                        ? `${activeFile?.path || ''} · page settings`
                        : isCaseStudyCategorySelected
                          ? `${activeFile?.path || ''} · category ${activeCaseStudyCategoryIndex + 1}`
                          : isCaseStudyItemSelected
                            ? `${activeFile?.path || ''} · case ${activeCaseStudyIndex + 1}`
                            : activeFile?.path
                  : activeFile?.path}
              </div>
            </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(getPreviewPath(), '_blank')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Preview
          </button>
          {allowCreateOrDuplicate && (
            <button
              type="button"
              onClick={handleCreate}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
            >
              {fileFilter === 'blog' ? 'New Post' : 'New Page'}
            </button>
          )}
          {allowCreateOrDuplicate && (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={!activeFile}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Duplicate
            </button>
          )}
          <button
            type="button"
            onClick={handleFormat}
            disabled={!activeFile}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Format
          </button>
          {activeFile &&
            !isServicesItemsMode &&
            !isConditionsItemsMode &&
            !isCaseStudiesItemsMode &&
            (activeFile.path.startsWith('pages/') ||
              isBlogManagedPath(activeFile.path)) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          <Button onClick={handleSave} disabled={!activeFile}>
            Save
          </Button>
        </div>
          </div>

          {status && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {status}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            {isThemeFile && (
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1.5 rounded-md text-xs ${
                  activeTab === 'presets'
                    ? 'bg-[var(--primary)] text-white'
                    : 'border border-gray-200 text-gray-700'
                }`}
              >
                Presets
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'form'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'json'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>

          {activeTab === 'presets' ? (
            isThemeFile && formData ? (
              <ThemePresetsTab currentTheme={formData} onApply={applyThemePreset} />
            ) : (
              <div className="text-sm text-gray-500">Presets are available only for theme.json.</div>
            )
          ) : activeTab === 'form' ? (
            <div className="space-y-6 text-sm">
              {!formData && (
                <div className="text-sm text-gray-500">
                  Invalid JSON. Switch to JSON tab to fix.
                </div>
              )}

              {isSeoPageFileActive && formData && (
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-900">SEO Page Form</div>
                  <div className="text-xs text-gray-500">
                    Structured recursive form for SEO landing content.
                  </div>
                  {renderGenericFormNode(formData)}
                </div>
              )}

              {isSeoFile && formData && (
                <SeoPanel
                  formData={formData}
                  seoPopulating={seoPopulating}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  populateSeoFromHeroes={populateSeoFromHeroes}
                  addSeoPage={addSeoPage}
                  removeSeoPage={removeSeoPage}
                />
              )}

              {isHeaderFile && formData && (
                <HeaderPanel
                  formData={formData}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  addHeaderMenuItem={addHeaderMenuItem}
                  removeHeaderMenuItem={removeHeaderMenuItem}
                  addHeaderLanguage={addHeaderLanguage}
                  removeHeaderLanguage={removeHeaderLanguage}
                />
              )}

              {isThemeFile && formData && (
                <ThemePanel
                  getPathValue={getPathValueLocal}
                  updateFormValue={updateFormValue}
                  renderColorField={renderColorField}
                />
              )}

              {showSharedPanels && formData && variantSections.length > 0 && (
                <SectionVariantsPanel
                  variantSections={variantSections}
                  getPathValue={getPathValueLocal}
                  updateFormValue={updateFormValue}
                  currentFilePath={activeFile?.path}
                />
              )}

              {isConditionsPageFile && showConditionsGlobalPanels && formData && (
                <ConditionsLayoutPanel
                  layoutVariant={String(formData.layoutVariant || 'categories-tabs')}
                  updateFormValue={updateFormValue}
                />
              )}

              {isHomePageFile && homePhotoFields.length > 0 && (
                <HomeSectionPhotosPanel
                  homePhotoFields={homePhotoFields}
                  getPathValue={getPathValueLocal}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {showSharedPanels && formData?.hero && (
                <HeroPanel
                  hero={formData.hero}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {showSharedPanels && isContactPageFile && formData?.form && (
                <ContactNotificationPanel
                  form={formData.form}
                  updateFormValue={updateFormValue}
                />
              )}

              {showSharedPanels && formData?.profile && (
                <ProfilePanel
                  profile={formData.profile}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {showSharedPanels && formData?.introduction && (
                <IntroductionPanel
                  introduction={formData.introduction}
                  updateFormValue={updateFormValue}
                />
              )}

              {showSharedPanels && activeFile?.path === 'pages/about.json' && formData && (
                <>
                  <AboutStaffsPanel
                    staffs={formData.staffs ?? formData.team ?? { title: '', members: [] }}
                    updateFormValue={updateFormValue}
                    openImagePicker={openImagePicker}
                  />
                  <AboutCredentialsPanel
                    credentials={
                      formData.credentials ?? { title: '', variant: 'list', items: [] }
                    }
                    updateFormValue={updateFormValue}
                    markdownPreview={markdownPreview}
                    toggleMarkdownPreview={toggleMarkdownPreview}
                  />
                  <AboutAffiliationsPanel
                    affiliations={
                      formData.affiliations ?? {
                        title: '',
                        variant: 'compact',
                        organizations: [],
                      }
                    }
                    updateFormValue={updateFormValue}
                  />
                  <AboutAdditionalPanel
                    formData={formData}
                    updateFormValue={updateFormValue}
                  />
                </>
              )}

              {showSharedPanels && Array.isArray(formData?.images) && (
                <GalleryPhotosPanel
                  images={formData.images}
                  galleryCategories={galleryCategories}
                  addGalleryCategory={addGalleryCategory}
                  removeGalleryCategory={removeGalleryCategory}
                  addGalleryImage={addGalleryImage}
                  removeGalleryImage={removeGalleryImage}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {showSharedPanels && formData?.cta && (
                <CtaPanel cta={formData.cta} updateFormValue={updateFormValue} />
              )}

              {showSharedPanels && formData?.reviewsWidget && (
                <ReviewsWidgetPanel
                  reviewsWidget={formData.reviewsWidget}
                  updateFormValue={updateFormValue}
                />
              )}

              {isPricingPageFile &&
                formData &&
                (formData?.individualTreatments || formData?.packages) && (
                <PricingPanel formData={formData} updateFormValue={updateFormValue} />
              )}

              {isServicesItemsMode && formData?.servicesList && selectedService && (
                <ServicesItemPanel
                  servicesList={formData.servicesList}
                  selectedService={selectedService}
                  selectedIndex={activeServiceIndex}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  removeServicesListItem={removeServicesListItem}
                />
              )}

              {isServicesItemsMode && isServicesPageSettingsSelected && formData && (
                <ServicesPanel
                  formData={formData}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  addServicesListItem={addServicesListItem}
                  removeServicesListItem={removeServicesListItem}
                  addTrustBarItem={addTrustBarItem}
                  removeTrustBarItem={removeTrustBarItem}
                  addRelatedReadingSlug={addRelatedReadingSlug}
                  removeRelatedReadingSlug={removeRelatedReadingSlug}
                  hideItemsEditor
                />
              )}

              {!isSeoPageFileActive &&
                !isServicesItemsMode &&
                (formData?.services ||
                  formData?.servicesList ||
                  formData?.trustBar ||
                  formData?.legacyLabels ||
                  formData?.relatedReading) && (
                <ServicesPanel
                  formData={formData}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  addServicesListItem={addServicesListItem}
                  removeServicesListItem={removeServicesListItem}
                  addTrustBarItem={addTrustBarItem}
                  removeTrustBarItem={removeTrustBarItem}
                  addRelatedReadingSlug={addRelatedReadingSlug}
                  removeRelatedReadingSlug={removeRelatedReadingSlug}
                />
              )}

              {isConditionsItemsMode && isConditionCategorySelected && selectedConditionCategory && (
                <ConditionCategoryItemPanel
                  category={selectedConditionCategory}
                  index={activeConditionCategoryIndex}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {isConditionsItemsMode && isConditionItemSelected && selectedConditionItem && (
                <ConditionItemPanel
                  condition={selectedConditionItem}
                  index={activeConditionIndex}
                  isConditionsPageFile={isConditionsPageFile}
                  conditionCategoryOptions={conditionCategoryOptions}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {isConditionsItemsMode &&
                isConditionsPageSettingsSelected &&
                isConditionsPageFile &&
                (formData?.categories || formData?.conditions) && (
                <ConditionsPanel
                  isConditionsPageFile={isConditionsPageFile}
                  categories={formData?.categories ?? []}
                  conditions={formData?.conditions ?? []}
                  sortedConditionCategories={sortedConditionCategories}
                  conditionCategoryOptions={conditionCategoryOptions}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  addConditionCategory={addConditionCategory}
                  removeConditionCategory={removeConditionCategory}
                  addConditionItem={addConditionItem}
                  removeConditionItem={removeConditionItem}
                  hideItemsEditor
                />
              )}

              {!isConditionsItemsMode &&
                isConditionsPageFile &&
                (formData?.categories || formData?.conditions) && (
                <ConditionsPanel
                  isConditionsPageFile={isConditionsPageFile}
                  categories={formData?.categories ?? []}
                  conditions={formData?.conditions ?? []}
                  sortedConditionCategories={sortedConditionCategories}
                  conditionCategoryOptions={conditionCategoryOptions}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                  addConditionCategory={addConditionCategory}
                  removeConditionCategory={removeConditionCategory}
                  addConditionItem={addConditionItem}
                  removeConditionItem={removeConditionItem}
                />
              )}

              {isCaseStudiesItemsMode &&
                isCaseStudyCategorySelected &&
                selectedCaseStudyCategory && (
                <CaseStudyCategoryItemPanel
                  category={selectedCaseStudyCategory}
                  index={activeCaseStudyCategoryIndex}
                  updateFormValue={updateFormValue}
                />
              )}

              {isCaseStudiesItemsMode && isCaseStudyItemSelected && selectedCaseStudyItem && (
                <CaseStudyItemPanel
                  item={selectedCaseStudyItem}
                  index={activeCaseStudyIndex}
                  caseStudyCategories={caseStudyCategories}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {!isCaseStudiesItemsMode && Array.isArray(formData?.caseStudies) && (
                <CaseStudiesPanel
                  caseStudies={formData.caseStudies}
                  caseStudyCategories={caseStudyCategories}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}


              {(formData?.featuredPost || Array.isArray(formData?.posts) || formData?.slug) && (
                <PostsPanel
                  formData={formData}
                  isBlogPostFile={!!isBlogPostFile}
                  blogServiceOptions={blogServiceOptions}
                  blogConditionOptions={blogConditionOptions}
                  markdownPreview={markdownPreview}
                  toggleMarkdownPreview={toggleMarkdownPreview}
                  toggleSelection={toggleSelection}
                  updateFormValue={updateFormValue}
                  openImagePicker={openImagePicker}
                />
              )}

              {isSiteInfoFile && formData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Site Info</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Icon Character</label>
                    <input
                      className="mt-1 w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={String((formData as any).iconCharacter || '')}
                      placeholder="H or FA"
                      onChange={(event) =>
                        updateFormValue(
                          ['iconCharacter'],
                          event.target.value.toUpperCase()
                        )
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to use default icon text: H.
                    </p>
                  </div>
                  {renderGenericFormNode(formData)}
                </div>
              )}

              {formData &&
                !isSiteInfoFile &&
                !isPricingPageFile &&
                !isSeoPageFileActive &&
                !formData.hero &&
                !formData.introduction &&
                !formData.cta && (
                <div className="text-sm text-gray-500">
                  No schema panels available for this file yet. Use the JSON tab.
                </div>
              )}
            </div>
          ) : isServicesItemSelected && selectedService ? (
            <ItemJsonEditor
              error={serviceItemJsonError}
              draft={serviceItemJsonDraft}
              onDraftChange={(next) => {
                setServiceItemJsonDraft(next);
                try {
                  const parsed = JSON.parse(next);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setServiceItemJsonError('Service item JSON must be an object.');
                    return;
                  }
                  setServiceItemJsonError(null);
                } catch (error) {
                  setServiceItemJsonError('Invalid JSON');
                }
              }}
              onApply={() => {
                try {
                  const parsed = JSON.parse(serviceItemJsonDraft);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setServiceItemJsonError('Service item JSON must be an object.');
                    return;
                  }
                  setServiceItemJsonError(null);
                  updateFormValue(['servicesList', 'items', String(activeServiceIndex)], parsed);
                  setStatus('Service JSON applied.');
                } catch (error) {
                  setServiceItemJsonError('Invalid JSON');
                }
              }}
              placeholder="Edit selected service JSON."
            />
          ) : (isConditionCategorySelected && selectedConditionCategory) ||
            (isConditionItemSelected && selectedConditionItem) ? (
            <ItemJsonEditor
              error={conditionsItemJsonError}
              draft={conditionsItemJsonDraft}
              onDraftChange={(next) => {
                setConditionsItemJsonDraft(next);
                try {
                  const parsed = JSON.parse(next);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setConditionsItemJsonError('Condition JSON must be an object.');
                    return;
                  }
                  setConditionsItemJsonError(null);
                } catch (error) {
                  setConditionsItemJsonError('Invalid JSON');
                }
              }}
              onApply={() => {
                try {
                  const parsed = JSON.parse(conditionsItemJsonDraft);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setConditionsItemJsonError('Condition JSON must be an object.');
                    return;
                  }
                  setConditionsItemJsonError(null);
                  if (isConditionCategorySelected) {
                    updateFormValue(['categories', String(activeConditionCategoryIndex)], parsed);
                    setStatus('Category JSON applied.');
                  } else if (isConditionItemSelected) {
                    updateFormValue(['conditions', String(activeConditionIndex)], parsed);
                    setStatus('Condition JSON applied.');
                  }
                } catch (error) {
                  setConditionsItemJsonError('Invalid JSON');
                }
              }}
              placeholder={
                isConditionCategorySelected
                  ? 'Edit selected category JSON.'
                  : 'Edit selected condition JSON.'
              }
            />
          ) : (isCaseStudyCategorySelected && selectedCaseStudyCategory) ||
            (isCaseStudyItemSelected && selectedCaseStudyItem) ? (
            <ItemJsonEditor
              error={caseStudiesItemJsonError}
              draft={caseStudiesItemJsonDraft}
              onDraftChange={(next) => {
                setCaseStudiesItemJsonDraft(next);
                try {
                  const parsed = JSON.parse(next);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setCaseStudiesItemJsonError('Case study JSON must be an object.');
                    return;
                  }
                  setCaseStudiesItemJsonError(null);
                } catch (error) {
                  setCaseStudiesItemJsonError('Invalid JSON');
                }
              }}
              onApply={() => {
                try {
                  const parsed = JSON.parse(caseStudiesItemJsonDraft);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    setCaseStudiesItemJsonError('Case study JSON must be an object.');
                    return;
                  }
                  setCaseStudiesItemJsonError(null);
                  if (isCaseStudyCategorySelected) {
                    updateFormValue(['categories', String(activeCaseStudyCategoryIndex)], parsed);
                    setStatus('Case study category JSON applied.');
                  } else if (isCaseStudyItemSelected) {
                    updateFormValue(['caseStudies', String(activeCaseStudyIndex)], parsed);
                    setStatus('Case study JSON applied.');
                  }
                } catch (error) {
                  setCaseStudiesItemJsonError('Invalid JSON');
                }
              }}
              placeholder={
                isCaseStudyCategorySelected
                  ? 'Edit selected category JSON.'
                  : 'Edit selected case study JSON.'
              }
            />
          ) : (
            <textarea
              className="w-full min-h-[520px] rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-800"
              value={content}
              onChange={(event) => {
                const next = event.target.value;
                setContent(next);
                try {
                  setFormData(JSON.parse(next));
                } catch (error) {
                  setFormData(null);
                }
              }}
              placeholder="Select a file to begin editing."
            />
          )}
        </div>
      </div>
      <ImagePickerModal
        open={showImagePicker}
        siteId={siteId}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}

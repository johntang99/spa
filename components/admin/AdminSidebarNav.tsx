'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Building2,
  Calendar,
  FileText,
  FolderGit2,
  Image,
  Layers,
  LayoutGrid,
  Rocket,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

export type IconKey =
  | 'activity'
  | 'bookOpen'
  | 'building2'
  | 'calendar'
  | 'fileText'
  | 'folderGit2'
  | 'image'
  | 'layers'
  | 'layoutGrid'
  | 'rocket'
  | 'settings'
  | 'shoppingBag'
  | 'slidersHorizontal'
  | 'users';

const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  bookOpen: BookOpen,
  building2: Building2,
  calendar: Calendar,
  fileText: FileText,
  folderGit2: FolderGit2,
  image: Image,
  layers: Layers,
  layoutGrid: LayoutGrid,
  rocket: Rocket,
  settings: Settings,
  shoppingBag: ShoppingBag,
  slidersHorizontal: SlidersHorizontal,
  users: Users,
};

export interface NavItem {
  name: string;
  href: string;
  iconKey: IconKey;
  group: 'site' | 'system';
  preserveContext?: boolean;
}

interface AdminSidebarNavProps {
  items: NavItem[];
}

function buildHrefWithContext(href: string, siteId: string, locale: string): string {
  if (!siteId && !locale) return href;
  const params = new URLSearchParams();
  if (siteId) params.set('siteId', siteId);
  if (locale) params.set('locale', locale);
  return `${href}?${params.toString()}`;
}

export function AdminSidebarNav({ items }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const locale = searchParams.get('locale') || '';
  const siteItems = items.filter((item) => item.group === 'site');
  const systemItems = items.filter((item) => item.group === 'system');

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  const renderSection = (title: string, sectionItems: NavItem[]) => {
    if (sectionItems.length === 0) return null;
    const hasActiveItem = sectionItems.some((item) => isItemActive(item.href));
    return (
      <div
        className={`space-y-1 rounded-lg p-1 ${
          hasActiveItem ? 'bg-emerald-50/60 border border-emerald-100' : ''
        }`}
      >
        <p
          className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide ${
            hasActiveItem ? 'text-emerald-700' : 'text-gray-400'
          }`}
        >
          {title}
        </p>
        {sectionItems.map((item) => {
          const Icon = ICONS[item.iconKey] || FileText;
          const href = item.preserveContext === false
            ? item.href
            : buildHrefWithContext(item.href, siteId, locale);
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-100/80 text-emerald-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
      {renderSection('Site Related', siteItems)}
      {renderSection('System', systemItems)}
    </nav>
  );
}

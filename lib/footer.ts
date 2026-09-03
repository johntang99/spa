import type { FooterSection, Locale } from './types';

export function getDefaultFooter(locale: Locale): FooterSection {
  const isChinese = locale === 'zh';

  return {
    brand: {
      logoText: 'BIZ',
      name: 'Business Name',
      description: isChinese
        ? '以高品质、专业的服务支持客户需求。'
        : 'Helping customers with high-quality, professional service.',
    },
    quickLinks: [
      { text: isChinese ? '关于我们' : 'About Us', url: `/${locale}/about` },
      { text: isChinese ? '服务项目' : 'Services', url: `/${locale}/services` },
      { text: isChinese ? '治疗病症' : 'Conditions', url: `/${locale}/conditions` },
      { text: isChinese ? '案例研究' : 'Case Studies', url: `/${locale}/case-studies` },
      { text: isChinese ? '新用户指南' : 'Getting Started', url: `/${locale}/new-patients` },
      { text: isChinese ? '博客' : 'Blog', url: `/${locale}/blog` },
      { text: isChinese ? '联系我们' : 'Contact', url: `/${locale}/contact` },
    ],
    services: [
      { text: isChinese ? '特色服务' : 'Featured Services', url: `/${locale}/services` },
      { text: isChinese ? '方案与套餐' : 'Plans & Packages', url: `/${locale}/services` },
      { text: isChinese ? '服务流程' : 'How It Works', url: `/${locale}/services` },
      { text: isChinese ? '支持与帮助' : 'Support', url: `/${locale}/contact` },
    ],
    contact: {
      addressLines: [
        isChinese ? '地址第一行' : 'Address line 1',
        isChinese ? '城市, 省/州 邮编' : 'City, State ZIP',
      ],
      phone: '(000) 000-0000',
      phoneLink: 'tel:+10000000000',
      email: 'info@example.com',
      emailLink: 'mailto:info@example.com',
    },
    hours: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 2:00 PM'],
    legalLinks: [
      { text: isChinese ? '隐私政策' : 'Privacy Policy', url: `/${locale}/privacy` },
      { text: isChinese ? '服务条款' : 'Terms of Service', url: `/${locale}/terms` },
    ],
    copyright: isChinese
      ? '© {year} Business Name. 版权所有。'
      : '© {year} Business Name. All rights reserved.',
  };
}

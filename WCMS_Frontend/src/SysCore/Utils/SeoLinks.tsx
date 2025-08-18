import React from 'react';
import type { Lang } from '../i18n/lang';
const SUPPORTED_LANGS: Lang[] = ["zh-tw", "zh-cn", "en"];

interface Props { resolvedLang: string; pathname: string }
const BASE = import.meta.env.VITE_SITE_ORIGIN;

export const SeoLinks: React.FC<Props> = ({ resolvedLang, pathname }) => {
  const pathNoLang = pathname.replace(/^\/[a-z]{2}-[a-z]{2}(?=\/|$)/i, ''); // 去掉前導語系段
  const isB = /^\/[a-z]{2}-[a-z]{2}(?=\/|$)/i.test(pathname);              // 是否為 B 形態

  const canonical = isB
    ? `${BASE}${pathname}`
    : `${BASE}/${resolvedLang}${pathNoLang || '/'}`;

  return (
    <>
      <link rel="canonical" href={canonical} />
      {SUPPORTED_LANGS.map(l => (
        <link key={l} rel="alternate" hrefLang={l} href={`${BASE}/${l}${pathNoLang || '/'}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${BASE}/${resolvedLang}${pathNoLang || '/'}`} />
    </>
  );
};

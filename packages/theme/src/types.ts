export type ThemeOptions = {
  title: string;
  url: string;
  author: string;
  description: string;
  base?: string;
  lang?: string;
  tagline?: string;
  hero?: { eyebrow?: string; title?: string; accent?: string; description?: string; note?: string };
  nav?: { label: string; href: string }[];
  reading?: { font?: 'sans' | 'serif'; size?: 17 | 19 | 21 };
  appearance?: 'auto' | 'light' | 'dark';
  motion?: 'auto' | 'off';
  search?: boolean;
  sidebar?: boolean;
  indexable?: boolean;
  footer?: string;
};
export type ThemeConfig = Required<Omit<ThemeOptions, 'hero' | 'reading'>> & {
  hero: Required<NonNullable<ThemeOptions['hero']>>;
  reading: Required<NonNullable<ThemeOptions['reading']>>;
};
export interface PostSummary {
  id: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  topic: string;
  href: string;
  minutes: number;
  featured?: boolean;
}
export interface Topic { name: string; href: string; count: number; description?: string }

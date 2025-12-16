export type NavVisibility = 'any' | 'auth' | 'guest';

export type NavItem = {
  label: string;
  to: string;
  visibility?: NavVisibility;
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'エントリー', to: '/', visibility: 'auth' },
  { label: 'ダッシュボード', to: '/dashboard', visibility: 'auth' },
  { label: '結果', to: '/result', visibility: 'auth' },
];


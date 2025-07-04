import {
  type LucideIcon,
  ShoppingCart,
  Car,
  Ticket,
  Zap,
  Utensils,
  MoreHorizontal,
} from 'lucide-react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="15" x2="15" y2="15" />
    <line x1="9" y1="18" x2="15" y2="18" />
    <path d="M11.5 12.5c0-1.1.9-2 2-2h0a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-1a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2h0" />
  </svg>
);

export const Icons = {
  Groceries: ShoppingCart,
  Transport: Car,
  Entertainment: Ticket,
  Utilities: Zap,
  Dining: Utensils,
  Other: MoreHorizontal,
} as const;

export type CategoryIcon = keyof typeof Icons;

export const getIconForCategory = (category: string): LucideIcon => {
  return Icons[category as CategoryIcon] || MoreHorizontal;
};

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
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2H4z" />
    <path d="M8 6h8" />
    <path d="M8 10h8" />
    <path d="M8 14h4" />
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

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
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="12" fill="#a8e6cf" />
    <g transform="rotate(-15 12 12) translate(0.5, 0)">
      <path
        d="M6 20V5c0-1.1.9-2 2-2h6.5c2.49 0 4.5 2.01 4.5 4.5S16.99 12 14.5 12H19v6.5l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2-1-1.2V20z"
        fill="#fff"
        stroke="#83bcf3"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3C12.01 3 10 5.01 10 7.5S12.01 12 14.5 12H19V7.5C19 5.01 16.99 3 14.5 3z"
        fill="#b1d7f6"
        stroke="#83bcf3"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 14h6m-6 2h8" stroke="#83bcf3" strokeWidth="1" strokeLinecap="round" />
      <path d="M16 10.5 h.01 M16 9 h.01 M16 7.5 h.01" stroke="#83bcf3" strokeWidth="1.2" strokeLinecap="round" />
    </g>
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

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
    <g transform="rotate(-15 12 12) translate(0, 0.5)">
        <path d="M7 5H17V19L15.5 17.5L14 19L12.5 17.5L11 19L9.5 17.5L8 19L7 18V5Z" fill="white" stroke="#3D995D" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M9 9H15" stroke="#3D995D" strokeWidth="1" strokeLinecap="round"/>
        <path d="M9 12H15" stroke="#3D995D" strokeWidth="1" strokeLinecap="round"/>
        <path d="M9 15H12" stroke="#3D995D" strokeWidth="1" strokeLinecap="round"/>
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

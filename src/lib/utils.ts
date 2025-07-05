import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Category } from "@/lib/types";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const categoryColorMap: { [key in Category]: string } = {
    Groceries: 'category-groceries',
    Transport: 'category-transport',
    Entertainment: 'category-entertainment',
    Utilities: 'category-utilities',
    Dining: 'category-dining',
    Other: 'category-other',
};

export function getCategoryColor(category: Category): string {
  const categoryCssVarMap: { [key in Category]: string } = {
    Groceries: 'var(--category-groceries)',
    Transport: 'var(--category-transport)',
    Entertainment: 'var(--category-entertainment)',
    Utilities: 'var(--category-utilities)',
    Dining: 'var(--category-dining)',
    Other: 'var(--category-other)',
  };
  return `hsl(${categoryCssVarMap[category] || categoryCssVarMap.Other})`;
}


export function getCategoryBorderStyle(category: Category): string {
    const color = categoryColorMap[category] || categoryColorMap.Other;
    return `border-t-${color}`;
}

export function getCategoryBgStyle(category: Category): string {
    const color = categoryColorMap[category] || categoryColorMap.Other;
    return `bg-${color}`;
}

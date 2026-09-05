"use client";

import {
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  Film,
  Gift,
  Heart,
  Home,
  Plane,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wallet,
  Zap,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  "shopping-cart": ShoppingCart,
  car: Car,
  home: Home,
  utensils: Utensils,
  zap: Zap,
  heart: Heart,
  plane: Plane,
  coffee: Coffee,
  film: Film,
  "book-open": BookOpen,
  gift: Gift,
  smartphone: Smartphone,
  briefcase: Briefcase,
  banknote: Banknote,
  wallet: Wallet,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? ShoppingCart;
  return <Icon className={className} />;
}

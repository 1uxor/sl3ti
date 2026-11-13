import {
  BarChart3,
  Boxes,
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const menu = [
  // Principal
  ["dashboard", LayoutDashboard],
  ["items", Package],
  ["inventory", Boxes],
  ["movements", ClipboardList],
  // Organisation
  ["locations", MapPin],
  ["customers", Users],
  ["suppliers", Truck],
  // Modules
  ["equipment", Shield],
  ["rentals", HandCoins],
  // Admin
  ["reports", BarChart3],
  ["team", Users],
  ["settings", Settings],
] as const;

export const menuGroups = [
  { label: "PRINCIPAL", items: ["dashboard", "items", "inventory", "movements"] },
  { label: "ORGANISATION", items: ["locations", "customers", "suppliers"] },
  { label: "MODULES", items: ["equipment", "rentals"] },
  { label: "ADMIN", items: ["reports", "team", "settings"] },
];

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

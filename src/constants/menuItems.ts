import { CircleUserIcon, FileVideoIcon, ScanIcon } from "lucide-react";
import type { MenuItem } from "@/types/menu";

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "About",
    href: "/about",
    show: "everyone",
    header: false,
    footer: true,
  },

  {
    label: "Terms",
    href: "/terms",
    show: "everyone",
    header: false,
    footer: true,
  },
  {
    label: "Privacy",
    href: "/privacy",
    show: "everyone",
    header: false,
    footer: true,
  },
  {
    label: "Support",
    href: "/support",
    show: "everyone",
    header: false,
    footer: true,
  },
];

interface NavItemType {
  label: string;
  icon: React.ElementType;
  path: string;
}

export const navItems: NavItemType[] = [
  {
    label: "Capture",
    icon: ScanIcon,
    path: "/capture",
  },
  {
    label: "Recordings",
    icon: FileVideoIcon,
    path: "/recordings",
  },

  {
    label: "Profile",
    icon: CircleUserIcon,
    path: "/profile",
  },
];

import { CircleUserIcon, FileVideoIcon, ScanIcon } from "lucide-react";

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

type navItemType = {
  label: string;
  icon: React.ElementType;
  path: string;
};

export const navItems: navItemType[] = [
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

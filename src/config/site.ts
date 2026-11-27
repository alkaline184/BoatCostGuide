import { calculators } from "./calculators";

export const site = {
  name: "BoatCostGuide",
  url: "https://boatcostguide.com",
  tagline: "Know the true cost of owning a boat.",
  description:
    "Explore recreational boat types, read buying guides, and use free calculators to plan boat financing and the cost of ownership.",
  socialImage: "/social.png",
} as const;

export const pages = {
  ...calculators,
  "/": {
    title: "BoatCostGuide — Explore Boats & Plan Ownership Costs",
    description: site.description,
  },
  "/about": {
    title: "About",
    description:
      "Learn why BoatCostGuide builds independent financial planning tools for US boat buyers and owners.",
  },
  "/methodology": {
    title: "Calculator Methodology",
    description:
      "See the fixed-rate loan formula, cash-flow assumptions and exclusions behind BoatCostGuide estimates.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "Learn how BoatCostGuide handles calculator inputs and website requests.",
  },
  "/terms": {
    title: "Terms of Use",
    description:
      "Read the terms for using BoatCostGuide’s free boating financial estimates and educational resources.",
  },
} as const;

export type PagePath = keyof typeof pages;

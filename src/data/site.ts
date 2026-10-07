/**
 * Site-wide constants shared across pages and components.
 */

export const SITE = {
  name: "UiEdge",
  legalName: "UiEdge",
  description:
    "UiEdge is a software development company in Kozhikode, Kerala, building custom software, web and mobile apps, and SaaS products for businesses across Kerala, South India, and worldwide.",
  /** Override for production via PUBLIC_SITE_URL env var. */
  url: "https://uiedge.in/",
  email: "admin@uiedge.in",
  footerTagline: "Software that runs your business.",
  copyright: "© 2026 UiEdge. All rights reserved.",
} as const;

/** Footer contact info. No phone number exists — email only. */
export const CONTACT = {
  email: { label: "admin@uiedge.in", href: "mailto:admin@uiedge.in" },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Company", href: "/studio" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

/** Footer Navigation column — Home / Company / Services / Projects / Blog. */
export const FOOTER_NAV = NAV_LINKS.filter((link) => link.label !== "Contact");

export const SOCIALS = [
  { label: "LinkedIn", url: "https://linkedin.com/company/uiedge" },
  { label: "Instagram", url: "https://instagram.com/uiedge.in" },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms of Service", href: "/legal/terms-of-service" },
] as const;

/** CTA label + destination used across the site. */
export const CTA = {
  label: "Book a free consultation",
  href: "/contact",
} as const;

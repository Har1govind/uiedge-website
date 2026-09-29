/**
 * Blog posts.
 * All 7 posts share one article body (see POST_BODY) — only
 * title/date/excerpt/image differ per post, matching the site's template
 * behavior.
 */
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
}

/** Byline shown on every post. */
export const POST_AUTHOR = { name: "UiEdge Team", role: "Product Studio" };

/** Rich-text block for the shared article body. */
export type BodyBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

/** [verbatim] shared article body — identical across every post on the live site. */
export const POST_BODY: BodyBlock[] = [
  {
    type: "p",
    text: "At UiEdge, we design and build websites, apps, and SaaS products that are meant to perform, not just look good.",
  },
  {
    type: "p",
    text: "A slow website is frustrating. Users expect pages to load instantly, and even a small delay can lead to lost visitors. Studies show that a 1-second delay in loading time can reduce conversions by 7%.",
  },
  {
    type: "p",
    text: "More than 50% of web traffic comes from mobile devices. If your site isn’t optimized for speed on mobile, you risk losing half of your potential audience.",
  },
  { type: "h2", text: "How Speed Affects SEO" },
  {
    type: "p",
    text: "Google prioritizes fast-loading websites in search rankings. If your site is slow, it might not appear on the first page of search results. Fast websites improve user experience (UX), reduce bounce rates, and keep visitors engaged longer.",
  },
  {
    type: "p",
    text: "More than 50% of web traffic comes from mobile devices. If your site isn’t optimized for speed on mobile, you risk losing half of your potential audience. Google’s Core Web Vitals measure mobile performance, making speed a critical ranking factor.",
  },
  { type: "h2", text: "What Slows Down a Website?" },
  { type: "p", text: "Several factors can make your site sluggish:" },
  {
    type: "ul",
    items: [
      "Large images without compression",
      "Unoptimized code (excessive JavaScript, CSS, and HTML)",
      "Too many HTTP requests from third-party scripts",
      "Slow hosting with limited bandwidth",
      "No caching strategies",
    ],
  },
  { type: "h2", text: "How to Improve Website Speed" },
  { type: "h3", text: "Optimize Images" },
  {
    type: "p",
    text: "Use modern formats like WebP instead of PNG or JPEG. Compress images without losing quality.",
  },
  { type: "h3", text: "Minimize Code" },
  { type: "p", text: "Reduce unused JavaScript and CSS. Minify files to decrease load time." },
  { type: "h3", text: "Use a Content Delivery Network (CDN)" },
  {
    type: "p",
    text: "A CDN stores copies of your site on multiple servers worldwide, delivering faster access to users based on their location.",
  },
  { type: "h3", text: "Enable Caching" },
  {
    type: "p",
    text: "Caching stores frequently used data, reducing the need for repeated downloads. This significantly improves loading times for returning visitors.",
  },
  { type: "h3", text: "Choose a Fast Hosting Provider" },
  {
    type: "p",
    text: "Your hosting provider plays a major role in site speed. Consider upgrading to managed hosting or cloud hosting for better performance.",
  },
  { type: "h2", text: "The Business Impact of a Fast Website" },
  { type: "p", text: "Faster websites lead to:" },
  {
    type: "ul",
    items: ["Higher conversion rates", "Better SEO rankings", "Improved user satisfaction", "Lower bounce rates"],
  },
  { type: "h2", text: "Final Thoughts" },
  {
    type: "p",
    text: "Speed isn’t just a technical metric—it directly impacts business success. Investing in website performance means happier users, better rankings, and increased revenue. If your site is slow, now is the time to fix it.",
  },
];

/** Display + chain order matches the site's grid and Previous/Next links. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-ui-ux-design-actually-costs-in-india-2026",
    title: "What UI/UX design actually costs in India (2026)",
    date: "Feb 2, 2026",
    excerpt: "A straight answer to a question most studios dodge — what UI/UX design really costs and why.",
    image: "/images/blog/how-a-well-designed-website-can-transform-your-business.jpg",
  },
  {
    slug: "a-practical-ux-audit-checklist-for-saas-products",
    title: "A practical UX audit checklist for SaaS products",
    date: "Jan 26, 2026",
    excerpt: "A working checklist for spotting the UX issues that quietly cost SaaS products users and revenue.",
    image: "/images/blog/the-psychology-of-color-in-branding-how-it-shapes-perception-and-behavior.jpg",
  },
  {
    slug: "5-onboarding-fixes-that-lift-saas-activation",
    title: "5 onboarding fixes that lift SaaS activation",
    date: "Jan 20, 2026",
    excerpt: "Five concrete onboarding changes that help more new users reach their first real value faster.",
    image: "/images/blog/speed-matters-why-website-performance-can-make-or-break-your-business.jpg",
  },
  {
    slug: "when-and-when-not-to-build-a-design-system",
    title: "When (and when not) to build a design system",
    date: "Dec 29, 2025",
    excerpt: "Design systems pay off at a certain scale — here's how to tell if you've reached it yet.",
    image: "/images/blog/dark-mode-a-trend-or-a-web-design-essential.jpg",
  },
  {
    slug: "how-to-choose-a-ui-ux-design-partner-in-kerala",
    title: "How to choose a UI/UX design partner in Kerala",
    date: "Jan 10, 2026",
    excerpt: "What to actually look for when picking a design partner, beyond a nice-looking portfolio.",
    image: "/images/blog/the-future-of-typography-trends-that-will-define-the-web.jpg",
  },
  {
    slug: "redesign-or-rebuild-how-to-decide",
    title: "Redesign or rebuild? How to decide",
    date: "Dec 29, 2025",
    excerpt: "A framework for deciding whether your product needs a redesign or a ground-up rebuild.",
    image: "/images/blog/brutalism-in-web-design-bold-aesthetic-or-just-bad-ux.jpg",
  },
  {
    slug: "why-we-build-our-own-software-products",
    title: "Why we build our own software products, not just client work",
    date: "Dec 29, 2025",
    excerpt: "Running our own veterinary platform and POS system changes how we design for clients too.",
    image: "/images/blog/why-custom-illustrations-make-brands-more-memorable.jpg",
  },
];

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
export const POST_AUTHOR = { name: "UiEdge Team", role: "Engineering & Products" };

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
    text: "At UiEdge, we build software, web and mobile apps, and SaaS products that are meant to perform in production, not just in a demo.",
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
    text: "Speed isn’t just a technical metric. It directly impacts business success. Investing in website performance means happier users, better rankings, and increased revenue. If your site is slow, now is the time to fix it.",
  },
];

/** Display + chain order matches the site's grid and Previous/Next links. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-custom-software-development-costs-in-india-2026",
    title: "What custom software development actually costs in India (2026)",
    date: "Feb 2, 2026",
    excerpt: "A straight answer to a question most vendors dodge: what custom software really costs in Kerala and across India, and what drives the price.",
    image: "/images/blog/custom-software-cost-india.jpg",
  },
  {
    slug: "build-vs-buy-custom-software-or-off-the-shelf",
    title: "Build vs buy: custom software or an off-the-shelf tool?",
    date: "Jan 26, 2026",
    excerpt: "A practical framework for deciding when custom software pays off, and when a SaaS subscription is the smarter call.",
    image: "/images/blog/build-vs-buy-software.jpg",
  },
  {
    slug: "how-to-scope-an-mvp-that-actually-ships",
    title: "How to scope an MVP that actually ships",
    date: "Jan 20, 2026",
    excerpt: "Cut the feature list down to what proves the idea, and launch in weeks, not quarters.",
    image: "/images/blog/scope-an-mvp.jpg",
  },
  {
    slug: "choosing-a-tech-stack-for-your-saas",
    title: "Choosing a tech stack for your SaaS in 2026",
    date: "Dec 29, 2025",
    excerpt: "What really matters when picking languages, frameworks, and cloud for a product you'll run for years.",
    image: "/images/blog/saas-tech-stack.jpg",
  },
  {
    slug: "how-to-choose-a-software-development-partner-in-kerala",
    title: "How to choose a software development partner in Kerala",
    date: "Jan 10, 2026",
    excerpt: "What to actually look for in a development partner, beyond a nice-looking portfolio.",
    image: "/images/blog/software-partner-kerala.jpg",
  },
  {
    slug: "modernise-or-rebuild-legacy-software",
    title: "Modernise or rebuild? What to do with legacy software",
    date: "Dec 29, 2025",
    excerpt: "A framework for deciding whether your existing system needs modernising or a ground-up rebuild.",
    image: "/images/blog/modernise-legacy-software.jpg",
  },
  {
    slug: "why-we-build-our-own-software-products",
    title: "Why a software services company builds its own products",
    date: "Dec 29, 2025",
    excerpt: "Running our own veterinary platform and POS system makes us better engineers for our clients.",
    image: "/images/blog/why-we-build-our-own-products.jpg",
  },
];

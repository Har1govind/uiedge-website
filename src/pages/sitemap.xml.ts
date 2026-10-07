/**
 * sitemap.xml — every public page, generated from the same data the pages use.
 * /portfolio (the sales deck) is intentionally left out.
 */
import type { APIRoute } from "astro";
import { SITE } from "../data/site";
import { BLOG_POSTS } from "../data/blog";
import { PROJECTS } from "../data/projects";

const STATIC_PATHS = ["/", "/studio", "/projects", "/blog", "/contact", "/legal/privacy-policy", "/legal/terms-of-service"];

export const GET: APIRoute = () => {
  const base = import.meta.env.PUBLIC_SITE_URL ?? SITE.url;
  const paths = [
    ...STATIC_PATHS,
    ...PROJECTS.map((project) => `/projects/${project.slug}`),
    ...BLOG_POSTS.map((post) => `/blog/${post.slug}`),
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path === "/" ? path : `${path}/`, base).href}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

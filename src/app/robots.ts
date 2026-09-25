import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marca";

/** OBRIGATORIO com `output: "export"`, como no sitemap. */
export const dynamic = "force-static";

/**
 * O robots.txt. Tudo liberado: o site nao tem area de conta nem de admin
 * publicada — o admin e um servidor local (`npm run admin`) que nunca vai ao ar.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

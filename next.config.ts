import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site 100% estatico na pasta `out/` — hospedagem gratuita no Cloudflare Pages.
  output: "export",

  // No modo estatico nao existe servidor para otimizar imagem. As capas vem do
  // CDN da AniList e sao servidas como estao.
  images: { unoptimized: true },

  trailingSlash: true,
};

export default nextConfig;

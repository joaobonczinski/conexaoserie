import { ImageResponse } from "next/og";

// O cartao que aparece quando alguem cola um link do site no WhatsApp, no
// Discord ou no X. E gerado no build e vira um PNG estatico em `out/` — nada
// roda em servidor.
//
// ATENCAO NO DEPLOY: o arquivo sai SEM extensao (`out/opengraph-image`), e
// hospedagem estatica decide o Content-Type pela extensao. O `public/_headers`
// o rotula como PNG; sem isso o cartao nao aparece em lugar nenhum, e o build
// passa igual. (Licao do Clickverse.)
//
// O caminho `/opengraph-image` tambem esta escrito em src/lib/metadados.ts,
// porque declarar `openGraph` numa pagina desliga a convencao deste arquivo.

// Obrigatorio com `output: "export"`, como no sitemap e no robots.
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Conexão Série — o calendário de séries no horário de Brasília.";

/** A antena da marca, a mesma do Marca.tsx, desenhada em escala. */
function Simbolo() {
  return (
    <svg width="148" height="148" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="9" fill="#4f46e5" />
      <g fill="none" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round">
        <path d="M11.4 20.6a6.5 6.5 0 0 1 0-9.2" />
        <path d="M20.6 11.4a6.5 6.5 0 0 1 0 9.2" />
        <path d="M7.8 24.2a11.6 11.6 0 0 1 0-16.4" opacity=".55" />
        <path d="M24.2 7.8a11.6 11.6 0 0 1 0 16.4" opacity=".55" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#ffffff" />
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // O papel quente do tema claro, que e o padrao do site.
          background: "#faf8f5",
          backgroundImage:
            "radial-gradient(circle at 50% 40%, #e0e7ff 0%, #faf8f5 62%)",
        }}
      >
        <Simbolo />
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 96,
            letterSpacing: -3,
          }}
        >
          <span style={{ color: "#57515f", fontWeight: 500 }}>conexão</span>
          <span style={{ color: "#17151c", fontWeight: 700 }}>série</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: "#57515f" }}>
          O calendário de séries no horário de Brasília
        </div>
      </div>
    ),
    size,
  );
}

/**
 * O "onde assistir" de um card: o ponto na cor da plataforma e o nome.
 *
 * E o `SelosDeStreaming` do Conexão Anime com UMA plataforma so: serie nao tem
 * a lista de servicos que o anime tem — ela sai num lugar, e e esse lugar que a
 * pessoa precisa saber.
 *
 * VIRA LINK SO QUANDO O ENDERECO ABRE NO BRASIL (`linkQueAbre`, em
 * plataformas.ts). Sem link, e o mesmo selo como texto: saber ONDE ja responde
 * metade da pergunta, e um link que nao abre gastaria o clique.
 *
 * SEMPRE PRESENTE e com `min-h`: e a disciplina de altura fixa dos cards, que
 * faz todos terminarem na mesma linha.
 */
export default function SeloDePlataforma({
  plataforma,
  cor,
  link,
  espacamento = "mt-2",
}: {
  plataforma: string;
  cor: string;
  link: string | null;
  espacamento?: string;
}) {
  const conteudo = (
    <>
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cor }}
      />
      {plataforma}
    </>
  );
  const classe =
    "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-realce px-1.5 py-0.5 text-[10px] font-medium text-suave";

  return (
    <div className={`${espacamento} flex min-h-[20px] gap-1 overflow-hidden`}>
      {link ? (
        // `relative z-10`: o selo mora dentro de cards que sao link por inteiro
        // (ver `LINK_QUE_COBRE`), e sem isto a area do card o cobriria.
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`${classe} relative z-10 transition-colors hover:bg-acento/10 hover:text-acento`}
        >
          {conteudo}
        </a>
      ) : (
        <span className={classe}>{conteudo}</span>
      )}
    </div>
  );
}

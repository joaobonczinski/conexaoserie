/**
 * O instante do build, em Unix segundos.
 *
 * E UMA CONSTANTE DE MODULO, e nao `Date.now()` dentro de cada pagina, por dois
 * motivos. O pratico: as regras do React Compiler recusam funcao impura durante
 * a renderizacao. O que importa mais: o nome diz o que o valor E. As paginas sao
 * geradas uma vez, no build, e "agora" dentro delas nunca foi o agora de quem
 * visita — e o do build. Tudo que depende do relogio de verdade (a contagem, o
 * "hoje" do calendario) e recalculado no navegador.
 *
 * Todas as paginas leem o MESMO valor, entao a home e a /estreias/ nunca
 * discordam sobre qual estreia ja passou.
 */
export const INSTANTE_DO_BUILD = Math.floor(Date.now() / 1000);

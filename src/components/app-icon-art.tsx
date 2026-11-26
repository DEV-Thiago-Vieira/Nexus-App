/**
 * Arte do ícone do app (chama branca sobre vermelho), usada pelo ImageResponse
 * em src/app/icon.tsx e src/app/apple-icon.tsx. O desenho ocupa ~56% do lado,
 * dentro da área segura de ícones "maskable" (80%).
 */
export function AppIconArt({ size }: { size: number }) {
  const art = Math.round(size * 0.56);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #f87171 0%, #dc2626 100%)",
      }}
    >
      <svg width={art} height={art} viewBox="0 0 16 16">
        <path
          fill="#ffffff"
          d="M8.6 1.2c.3 2.2-.6 3.3-1.6 4.4C6 6.7 5 7.8 5 9.6c0 .9.3 1.7.9 2.3-.1-1.6.8-2.6 1.6-3.4.5.9 1.6 1.6 1.6 3.1 0 .4-.1.8-.3 1.1A3.6 3.6 0 0 0 12 9.4c0-3.7-2.4-5.7-3.4-8.2Z"
        />
      </svg>
    </div>
  );
}

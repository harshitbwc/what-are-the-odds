export default function manifest() {
  return {
    name: "What are the odds?",
    short_name: "Odds",
    description: "Dare your friends. Settle it on-chain.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0a001a",
    theme_color: "#0a001a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

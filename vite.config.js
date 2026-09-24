import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "KrishiSetu",
        short_name: "KrishiSetu",
        description:
          "AI-powered digital agriculture platform for smarter and sustainable farming.",
        theme_color: "#047857",
        background_color: "#f7faf5",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
      },
    }),
  ],
});
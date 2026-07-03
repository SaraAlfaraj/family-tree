import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // مسار GitHub Pages لموقع مشروع (project site): https://<user>.github.io/<repo>/
  // إن اختلف اسم المستودع على GitHub عن "family-tree" غيّر القيمة هنا لتطابقه.
  base: "/family-tree/",
});

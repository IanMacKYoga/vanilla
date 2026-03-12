import { serve } from "bun";
import { file } from "bun";

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = "./dist" + url.pathname;
    
    try {
      return new Response(await file(filePath));
    } catch {
      // Serve index.html for SPA routing
      return new Response(await file("./dist/index.html"));
    }
  },
});

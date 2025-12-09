import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildFrontend() {
  await rm("dist/public", { recursive: true, force: true });

  console.log("building frontend...");
  await viteBuild();
  
  console.log("frontend build complete!");
}

buildFrontend().catch((err) => {
  console.error(err);
  process.exit(1);
});

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const entryPoints = {
  'bridge-main': 'src/bridges/cryptpad_main_bridge.ts',
  'bridge-sand': 'src/bridges/cryptpad_sandbox_bridge.ts',
  'bridge-sso': 'src/bridges/sso_bridge.ts',
  'bridge-plugin': 'src/bridges/webmail_bridge.ts'
};

async function build() {
  const result = await esbuild.build({
    entryPoints: Object.values(entryPoints),
    bundle: true,
    minify: false,
    write: false,
    outdir: 'dist',
    format: 'iife',
    sourcemap: 'inline',
  });

  if (!fs.existsSync('dist')) fs.mkdirSync('dist');

  result.outputFiles.forEach(file => {
    const name = path.basename(file.path, '.js');
    const html = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n<script>\n${file.text}\n</script>\n</body>\n</html>`;
    fs.writeFileSync(`dist/${name}.html`, html);
  });
  
  console.log('✅ Build terminé ! Les 4 fichiers HTML sont dans le dossier /dist');
}

build().catch(() => process.exit(1));
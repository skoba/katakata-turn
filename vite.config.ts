import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile(),
    {
      name: 'offline-policy',
      apply: 'build',
      enforce: 'post',
      generateBundle(_options, bundle) {
        const html = bundle['index.html'];
        if (html?.type !== 'asset') throw new Error('Missing single-file HTML');
        const policy =
          "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'";
        html.source = String(html.source).replace(
          '<head>',
          `<head>\n<meta http-equiv="Content-Security-Policy" content="${policy}">`,
        );
      },
    },
  ],
  build: { target: 'es2022' },
});

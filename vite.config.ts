import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Build de demonstração (`npm run build:demo`):
 * embute todo o JS e CSS dentro de um único HTML, para abrir com dois cliques
 * no Chrome (file://), sem servidor, sem internet de backend e sem banco de dados.
 */
function singleFileDemo(): Plugin {
  return {
    name: 'lynus-single-file-demo',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = Object.values(bundle).find(
        (f) => f.type === 'asset' && f.fileName.endsWith('.html')
      );
      if (!htmlAsset || htmlAsset.type !== 'asset') return;

      let html = String(htmlAsset.source);

      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          const code = file.code.replace(/<\/script/gi, '<\\/script');
          html = html.replace(
            new RegExp(`<script[^>]*src="[^"]*${escapeRe(file.fileName)}"[^>]*></script>`),
            () => `<script type="module">\n${code}\n</script>`
          );
          delete bundle[name];
        } else if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          const css = String(file.source).replace(/<\/style/gi, '<\\/style');
          html = html.replace(
            new RegExp(`<link[^>]*href="[^"]*${escapeRe(file.fileName)}"[^>]*>`),
            () => `<style>\n${css}\n</style>`
          );
          delete bundle[name];
        }
      }

      // Favicon embutido (o caminho /favicon.svg não existe ao abrir via file://)
      const faviconPath = path.resolve(__dirname, 'public/favicon.svg');
      if (fs.existsSync(faviconPath)) {
        const svg = fs.readFileSync(faviconPath, 'utf-8');
        html = html.replace(
          /href="[^"]*favicon\.svg"/,
          () => `href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}"`
        );
      }

      htmlAsset.source = html;
    },
    writeBundle(options) {
      // Remove a cópia da pasta public (já embutida no HTML)
      const out = options.dir ?? 'demo';
      const fav = path.join(out, 'favicon.svg');
      if (fs.existsSync(fav)) fs.rmSync(fav);
    },
  };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDemo = mode === 'demo';

  return {
    plugins: [react(), ...(isDemo ? [singleFileDemo()] : [])],
    base: isDemo ? './' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    build: isDemo
      ? {
          outDir: 'demo',
          emptyOutDir: true,
          cssCodeSplit: false,
          assetsInlineLimit: 100_000_000,
          chunkSizeWarningLimit: 100_000,
          modulePreload: false,
          rollupOptions: {
            output: { inlineDynamicImports: true },
          },
        }
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                'vendor-supabase': ['@supabase/supabase-js'],
                'vendor-state': ['@tanstack/react-query', 'zustand'],
                'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
              },
            },
          },
        },
  };
});

import DefaultTheme from 'vitepress/theme';
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import './custom.css';

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute();

    const initZoom = () => {
      nextTick(() => {
        // Mermaid SVGs → convertir a img para medium-zoom
        const svgs = document.querySelectorAll('.vp-doc .mermaid svg');
        svgs.forEach(svg => {
          if (!svg.classList.contains('zoom-processed')) {
            const xml = new XMLSerializer().serializeToString(svg);
            const svg64 = btoa(unescape(encodeURIComponent(xml)));
            const img = document.createElement('img');
            img.src = 'data:image/svg+xml;base64,' + svg64;
            img.className = 'zoomable-mermaid';
            svg.style.display = 'none';
            svg.parentNode!.insertBefore(img, svg);
            svg.classList.add('zoom-processed');
            mediumZoom(img, { background: 'var(--vp-c-bg)', margin: 24 });
          }
        });

        // PlantUML images → medium-zoom directo
        const plantUmlImgs = document.querySelectorAll<HTMLImageElement>(
          '.vp-doc img[src*="plantuml"]:not(.zoom-processed)'
        );
        plantUmlImgs.forEach(img => {
          img.classList.add('zoom-processed');
          mediumZoom(img, { background: 'var(--vp-c-bg)', margin: 24 });
        });
      });
    };

    onMounted(() => {
      setTimeout(initZoom, 800);
      setTimeout(initZoom, 2200);
    });

    watch(() => route.path, () => nextTick(() => setTimeout(initZoom, 800)));
  },
};

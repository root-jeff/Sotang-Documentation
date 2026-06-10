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
        const svgs = document.querySelectorAll('.vp-doc .mermaid svg');
        if (svgs.length > 0) {
          svgs.forEach(svg => {
            // MediumZoom no soporta SVGs en línea directamente, así que los envolvemos en una img data URI
            if(!svg.classList.contains('zoom-processed')) {
              const xml = new XMLSerializer().serializeToString(svg);
              const svg64 = btoa(unescape(encodeURIComponent(xml)));
              const b64Start = 'data:image/svg+xml;base64,';
              const image64 = b64Start + svg64;
              
              const img = document.createElement('img');
              img.src = image64;
              img.className = 'zoomable-mermaid';
              
              // Ocultamos el svg original y mostramos la imagen generada
              svg.style.display = 'none';
              svg.parentNode.insertBefore(img, svg);
              svg.classList.add('zoom-processed');
              
              mediumZoom(img, { background: 'var(--vp-c-bg)', margin: 24 });
            }
          });
        }
      });
    };

    onMounted(() => {
      setTimeout(initZoom, 1000);
      setTimeout(initZoom, 2500);
    });
    watch(() => route.path, () => nextTick(() => setTimeout(initZoom, 1000)));
  }
};
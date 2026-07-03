import DefaultTheme from 'vitepress/theme';
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import './custom.css';

import PresHero from './components/PresHero.vue';
import StatGrid from './components/StatGrid.vue';
import Reveal from './components/Reveal.vue';
import ArchLayers from './components/ArchLayers.vue';
import PatternCards from './components/PatternCards.vue';
import RiskMatrix from './components/RiskMatrix.vue';
import MetricBars from './components/MetricBars.vue';
import UseCaseStepper from './components/UseCaseStepper.vue';
import ReqExplorer from './components/ReqExplorer.vue';
import SecurityLayers from './components/SecurityLayers.vue';
import PhaseTimeline from './components/PhaseTimeline.vue';
import BeforeAfter from './components/BeforeAfter.vue';
import IvaCalc from './components/IvaCalc.vue';
import FlowAnim from './components/FlowAnim.vue';
import TrackBoard from './components/TrackBoard.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PresHero', PresHero);
    app.component('StatGrid', StatGrid);
    app.component('Reveal', Reveal);
    app.component('ArchLayers', ArchLayers);
    app.component('PatternCards', PatternCards);
    app.component('RiskMatrix', RiskMatrix);
    app.component('MetricBars', MetricBars);
    app.component('UseCaseStepper', UseCaseStepper);
    app.component('ReqExplorer', ReqExplorer);
    app.component('SecurityLayers', SecurityLayers);
    app.component('PhaseTimeline', PhaseTimeline);
    app.component('BeforeAfter', BeforeAfter);
    app.component('IvaCalc', IvaCalc);
    app.component('FlowAnim', FlowAnim);
    app.component('TrackBoard', TrackBoard);
  },
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

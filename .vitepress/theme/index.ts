import DefaultTheme from 'vitepress/theme';
// Import directo al build ESM: bajo SSR, Vite resuelve el campo "main" del
// paquete (UMD) en vez de "module", lo que rompe el export default.
import Panzoom from '@panzoom/panzoom/dist/panzoom.es.js';
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
import AuthFlowAnim from './components/AuthFlowAnim.vue';
import BackupFlowAnim from './components/BackupFlowAnim.vue';
import TelegramFlowAnim from './components/TelegramFlowAnim.vue';
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
    app.component('AuthFlowAnim', AuthFlowAnim);
    app.component('BackupFlowAnim', BackupFlowAnim);
    app.component('TelegramFlowAnim', TelegramFlowAnim);
    app.component('TrackBoard', TrackBoard);
  },
  setup() {
    const route = useRoute();

    // Envuelve un diagrama (SVG de mermaid o <img> de PlantUML) en un
    // contenedor navegable: arrastrar para desplazar, rueda/pellizco para
    // hacer zoom y botones +/−/reset, igual que la vista de diagramas de GitHub.
    const setupPanzoom = (el: HTMLElement) => {
      if (el.classList.contains('zoom-processed')) return;
      el.classList.add('zoom-processed', 'diagram-panzoom-target');

      const wrap = document.createElement('div');
      wrap.className = 'diagram-panzoom-wrap';

      const viewport = document.createElement('div');
      viewport.className = 'diagram-panzoom-viewport';

      const toolbar = document.createElement('div');
      toolbar.className = 'diagram-panzoom-toolbar';
      toolbar.innerHTML =
        '<button type="button" class="dpz-btn dpz-zoom-out" title="Alejar" aria-label="Alejar">−</button>' +
        '<button type="button" class="dpz-btn dpz-reset" title="Restablecer" aria-label="Restablecer">⤢</button>' +
        '<button type="button" class="dpz-btn dpz-zoom-in" title="Acercar" aria-label="Acercar">+</button>';

      el.parentNode!.insertBefore(wrap, el);
      viewport.appendChild(el);
      wrap.appendChild(viewport);
      wrap.appendChild(toolbar);

      // Sin "contain": con 'outside' Panzoom nunca deja el elemento más
      // pequeño que el contenedor, lo que bloqueaba el zoom-out en diagramas
      // grandes. Sin contención el usuario puede arrastrar libremente y
      // "Restablecer" siempre recentra la vista.
      const instance = Panzoom(el, {
        maxScale: 8,
        minScale: 0.2,
        cursor: 'grab',
      });

      viewport.addEventListener('wheel', instance.zoomWithWheel);
      viewport.addEventListener('dblclick', () => instance.reset());
      toolbar.querySelector('.dpz-zoom-in')!.addEventListener('click', () => instance.zoomIn());
      toolbar.querySelector('.dpz-zoom-out')!.addEventListener('click', () => instance.zoomOut());
      toolbar.querySelector('.dpz-reset')!.addEventListener('click', () => instance.reset());
    };

    const initZoom = () => {
      nextTick(() => {
        const mermaidSvgs = document.querySelectorAll<SVGSVGElement>(
          '.vp-doc .mermaid svg:not(.zoom-processed)'
        );
        mermaidSvgs.forEach(svg => setupPanzoom(svg as unknown as HTMLElement));

        const plantUmlImgs = document.querySelectorAll<HTMLImageElement>(
          '.vp-doc img[src*="plantuml"]:not(.zoom-processed)'
        );
        plantUmlImgs.forEach(img => setupPanzoom(img));
      });
    };

    onMounted(() => {
      setTimeout(initZoom, 800);
      setTimeout(initZoom, 2200);
    });

    watch(() => route.path, () => nextTick(() => setTimeout(initZoom, 800)));
  },
};

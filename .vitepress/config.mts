import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import markdownItPlantUml from "markdown-it-plantuml";

export default withMermaid(
  defineConfig({
    base: "/Sotang-Documentation/",
    cleanUrls: true,
    srcExclude: ["**/README.md", "**/ROADMAP.md"],

    title: "Sotang Docs",
    description: "Documentación técnica del ecosistema Sotang — finanzas personales 100% locales",

    head: [
      ["link", { rel: "icon", href: "/Sotang-Documentation/sotang_icon.png" }],
    ],

    markdown: {
      config: (md) => {
        md.use(markdownItPlantUml, {
          openMarker: "```plantuml",
          closeMarker: "```",
          server: "https://www.plantuml.com/plantuml",
        });
      },
    },

    themeConfig: {
      logo: "/sotang_icon.png",

      nav: [
        { text: "Home", link: "/" },
        { text: "Presentación", link: "/presentacion/" },
        {
          text: "Architecture",
          items: [
            { text: "System Overview", link: "/arquitectura/overview" },
            { text: "Components", link: "/arquitectura/componentes" },
            { text: "Deployment", link: "/arquitectura/deployment" },
            { text: "Security", link: "/arquitectura/security" },
            { text: "Repository Strategy", link: "/arquitectura/repos-strategy" },
          ],
        },
        {
          text: "API",
          items: [
            { text: "API Design", link: "/arquitectura/api-design" },
            { text: "Data Flows", link: "/arquitectura/data-flows" },
          ],
        },
        { text: "Database", link: "/base-de-datos/erd" },
        {
          text: "Design",
          items: [
            { text: "Architectural Patterns", link: "/entrega2/patrones-arquitectonicos" },
            { text: "GoF Design Patterns", link: "/entrega2/patrones-diseno" },
            { text: "Metrics", link: "/entrega2/metricas-diseno" },
            { text: "Formal Analysis", link: "/entrega2/analisis-formal" },
            { text: "Improvement Techniques", link: "/entrega2/mejoras-diseno" },
          ],
        },
      ],

      sidebar: {
        "/arquitectura/": [
          {
            text: "Architecture",
            items: [
              { text: "System Overview", link: "/arquitectura/overview" },
              { text: "Components & Modules", link: "/arquitectura/componentes" },
              { text: "Deployment (K3s)", link: "/arquitectura/deployment" },
              { text: "Security Model", link: "/arquitectura/security" },
              { text: "Repository Strategy", link: "/arquitectura/repos-strategy" },
            ],
          },
          {
            text: "API",
            items: [
              { text: "API Design", link: "/arquitectura/api-design" },
              { text: "Data Flows", link: "/arquitectura/data-flows" },
            ],
          },
        ],
        "/base-de-datos/": [
          {
            text: "Database",
            items: [
              { text: "Entity Relationship Diagram", link: "/base-de-datos/erd" },
              { text: "Table Dictionary", link: "/base-de-datos/tablas" },
            ],
          },
        ],
        "/entrega2/": [
          {
            text: "Design",
            items: [
              { text: "Architectural Patterns", link: "/entrega2/patrones-arquitectonicos" },
              { text: "GoF Design Patterns", link: "/entrega2/patrones-diseno" },
              { text: "Design Metrics (CK + McCabe)", link: "/entrega2/metricas-diseno" },
              { text: "Formal Analysis (ATAM)", link: "/entrega2/analisis-formal" },
              { text: "Improvement Techniques", link: "/entrega2/mejoras-diseno" },
            ],
          },
        ],
        "/presentacion/": [
          {
            text: "Presentación del Proyecto",
            items: [
              { text: "Portada", link: "/presentacion/" },
              { text: "1. El Problema", link: "/presentacion/problema" },
              { text: "2. Requerimientos", link: "/presentacion/requerimientos" },
              { text: "3. Casos de Uso", link: "/presentacion/casos-de-uso" },
              { text: "4. Arquitectura", link: "/presentacion/arquitectura" },
              { text: "5. Seguridad", link: "/presentacion/seguridad" },
              { text: "6. Patrones de Diseño", link: "/presentacion/patrones" },
              { text: "7. Métricas de Calidad", link: "/presentacion/metricas" },
              { text: "8. Riesgos y Análisis Formal", link: "/presentacion/riesgos" },
              { text: "9. Mejoras del Diseño", link: "/presentacion/mejoras" },
              { text: "10. Roadmap y Conclusiones", link: "/presentacion/conclusiones" },
            ],
          },
        ],
        "/requerimientos/": [
          {
            text: "Requirements",
            items: [
              { text: "Overview", link: "/requerimientos/overview" },
            ],
          },
        ],
      },

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/root-jeff/Sotang-Documentation",
        },
      ],

      footer: {
        message: "Personal finance — 100% local data",
        copyright: "Copyright © 2026-present Jefferson Palma",
      },
    },
  }),
);

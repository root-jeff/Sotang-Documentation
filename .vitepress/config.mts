import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    // Configuración de despliegue para GitHub Pages
    base: "/Sotang-Documentation/",
    cleanUrls: true,
    srcExclude: ["**/README.md", "**/ROADMAP.md"],

    title: "Sotang Architecture",
    description: "Documentación oficial del ecosistema Sotang",

    // Icono de la pestaña (Favicon)
    head: [
      ["link", { rel: "icon", href: "/Sotang-Documentation/sotang_icon.png" }],
    ],

    themeConfig: {
      // Logo en la barra de navegación
      logo: "/sotang_icon.png",

      nav: [
        { text: "Inicio", link: "/" },
        { text: "Arquitectura", link: "/arquitectura/overview" },
        { text: "Base de Datos", link: "/base-de-datos/erd" },
        { text: "Requerimientos", link: "/requerimientos/overview" },
      ],

      sidebar: [
        {
          text: "Arquitectura",
          items: [
            { text: "Visión General", link: "/arquitectura/overview" },
            {
              text: "Componentes y Módulos",
              link: "/arquitectura/componentes",
            },
            { text: "Despliegue (K3s)", link: "/arquitectura/deployment" },
            { text: "Seguridad", link: "/arquitectura/security" },
            { text: "Diseño de API", link: "/arquitectura/api-design" },
            { text: "Flujos de Datos", link: "/arquitectura/data-flows" },
          ],
        },
        {
          text: "Base de Datos",
          items: [
            { text: "Modelo ERD", link: "/base-de-datos/erd" },
            { text: "Diccionario de Tablas", link: "/base-de-datos/tablas" },
          ],
        },
        {
          text: "Requerimientos",
          items: [{ text: "Visión General", link: "/requerimientos/overview" }],
        },
        {
          text: "Patrones de Diseño",
          items: [
            { text: "Ejemplos Prácticos", link: "/patrones/intro" },
            // { text: "App Interactiva", link: "/patrones/app" },
          ],
        },
      ],

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/root-jeff/Sotang-Documentation",
        },
      ],

      footer: {
        message: "Arquitectura de Software - Universidad de Guayaquil",
        copyright: "Copyright © 2026-present Jefferson Palma",
      },
    },
  }),
);

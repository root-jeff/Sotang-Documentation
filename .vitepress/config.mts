import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: 'Sotang Architecture',
    description: 'Documentación oficial',
    themeConfig: {
      nav: [
        { text: 'Inicio', link: '/' },
        { text: 'Arquitectura', link: '/arquitectura/overview' },
        { text: 'Base de Datos', link: '/base-de-datos/erd' },
        { text: 'Patrones', link: '/patrones/intro' }
      ],
      sidebar: [
        {
          text: 'Arquitectura',
          items: [
            { text: 'Visión General', link: '/arquitectura/overview' },
            { text: 'Componentes y Módulos', link: '/arquitectura/componentes' },
            { text: 'Despliegue (K3s)', link: '/arquitectura/deployment' }
          ]
        },
        {
          text: 'Base de Datos',
          items: [
            { text: 'Modelo ERD', link: '/base-de-datos/erd' },
            { text: 'Diccionario de Tablas', link: '/base-de-datos/tablas' }
          ]
        },
        {
          text: 'Requerimientos',
          items: [
            { text: 'Visión General', link: '/requerimientos/overview' }
          ]
        },
        {
          text: 'Patrones de Diseño',
          items: [
            { text: 'Ejemplos Prácticos', link: '/patrones/intro' },
            { text: 'App Interactiva', link: '/patrones/app' }
          ]
        }
      ]
    }
  })
);
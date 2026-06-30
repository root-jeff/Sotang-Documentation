---
layout: home

hero:
  image:
    src: /sotang_icon.png
    alt: Sotang
  name: Sotang
  text: Personal finance — 100% local data
  tagline: Fastify · React Native · Telegram Bot · Raspberry Pi 5 · K3s
  actions:
    - theme: brand
      text: System Overview
      link: /arquitectura/overview
    - theme: alt
      text: Design Patterns
      link: /entrega2/patrones-arquitectonicos
    - theme: alt
      text: Database
      link: /base-de-datos/erd

features:
  - icon: 🏗️
    title: Modular Monolith
    details: Fastify backend with 12 independent business modules. Single Node.js process, low RAM footprint on Raspberry Pi, explicit boundaries between modules.
    link: /arquitectura/overview
    linkText: View architecture

  - icon: 📦
    title: Polyrepo — 6 repositories
    details: sotang-api, sotang-mobile, sotang-bot, sotang-shared, sotang-infra and sotang-web. Independent CI/CD per service. Shared types via GitHub Packages.
    link: /arquitectura/repos-strategy
    linkText: View repo strategy

  - icon: 📱
    title: Multi-channel
    details: Mobile App (React Native + Expo), Telegram Bot (gramMY) and Web SPA (Phase 2) — all over the same REST API. Notifications via Resend, Firebase FCM and Telegram.
    link: /arquitectura/componentes
    linkText: View components

  - icon: 🔒
    title: Defence in depth
    details: 6 layers — Cloudflare Tunnels, TLS Traefik, JWT 15 min, userId authorization, TypeBox validation, PostgreSQL with Drizzle ORM (no SQL injection).
    link: /arquitectura/security
    linkText: View security model

  - icon: 📐
    title: 8 GoF patterns documented
    details: Singleton, Factory Method, Decorator, Adapter, Composite, Observer, Strategy and State — with UML class diagrams and real TypeScript code.
    link: /entrega2/patrones-diseno
    linkText: View design patterns

  - icon: 📊
    title: Metrics & Formal Analysis
    details: CK Metrics Suite (WMC, CBO, LCOM, DIT, NOC), McCabe V(G), ATAM checklist, interface contracts and architectural risk analysis R=P×I.
    link: /entrega2/metricas-diseno
    linkText: View metrics
---

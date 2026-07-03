<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  badge?: string
}>()
</script>

<template>
  <div class="pres-hero">
    <div class="pres-hero-glow" />
    <span v-if="badge" class="pres-hero-badge">{{ badge }}</span>
    <h1 class="pres-hero-title">{{ title }}</h1>
    <p v-if="subtitle" class="pres-hero-subtitle">{{ subtitle }}</p>
    <div class="pres-hero-actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pres-hero {
  position: relative;
  text-align: center;
  padding: 72px 24px 56px;
  overflow: hidden;
  border-radius: 16px;
  margin: 16px 0 32px;
  background: linear-gradient(160deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08));
  border: 1px solid var(--vp-c-divider);
}
.pres-hero-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 480px;
  height: 320px;
  background: radial-gradient(ellipse, rgba(16, 185, 129, 0.25), transparent 70%);
  filter: blur(40px);
  animation: hero-pulse 5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes hero-pulse {
  0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
}
.pres-hero-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  padding: 4px 16px;
  margin-bottom: 20px;
  animation: fade-up 0.6s ease both;
}
.pres-hero-title {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 16px;
  border: none;
  padding: 0;
  background: linear-gradient(90deg, var(--vp-c-brand-1), #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fade-up 0.6s 0.1s ease both;
}
.pres-hero-subtitle {
  font-size: clamp(15px, 2.5vw, 19px);
  color: var(--vp-c-text-2);
  max-width: 640px;
  margin: 0 auto;
  animation: fade-up 0.6s 0.2s ease both;
}
.pres-hero-actions {
  margin-top: 28px;
  animation: fade-up 0.6s 0.3s ease both;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

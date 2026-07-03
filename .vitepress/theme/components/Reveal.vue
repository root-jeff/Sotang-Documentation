<script setup lang="ts">
import { ref, onMounted } from 'vue'

withDefaults(defineProps<{ delay?: number }>(), { delay: 0 })

const el = ref<HTMLElement | null>(null)
const visible = ref(false)

onMounted(() => {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        visible.value = true
        obs.disconnect()
      }
    }),
    { threshold: 0.15 }
  )
  if (el.value) obs.observe(el.value)
})
</script>

<template>
  <div ref="el" class="reveal" :class="{ 'is-visible': visible }" :style="{ transitionDelay: delay + 'ms' }">
    <slot />
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>

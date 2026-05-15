<template>
  <canvas ref="canvasRef" class="particle-background"></canvas>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface Props {
  particleCount?: number;
  particleColor?: string;
  lineColor?: string;
  particleRadius?: { min: number; max: number };
  particleSpeed?: number;
  lineDistance?: number;
  lineOpacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  particleCount: 80,
  particleColor: '#409eff',
  lineColor: '#409eff',
  particleRadius: () => ({ min: 1, max: 3 }),
  particleSpeed: 0.3,
  lineDistance: 120,
  lineOpacity: 0.15,
});

const canvasRef = ref<HTMLCanvasElement>();
let animationId: number | null = null;
let particles: Particle[] = [];
let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let reducedMotion = false;

function checkReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createParticle(): Particle {
  const { particleRadius, particleSpeed } = props;
  return {
    x: random(0, width),
    y: random(0, height),
    vx: random(-particleSpeed, particleSpeed),
    vy: random(-particleSpeed, particleSpeed),
    radius: random(particleRadius.min, particleRadius.max),
    opacity: random(0.3, 0.8),
  };
}

function initParticles(): void {
  particles = [];
  for (let i = 0; i < props.particleCount; i++) {
    particles.push(createParticle());
  }
}

function updateParticle(particle: Particle): void {
  particle.x += particle.vx;
  particle.y += particle.vy;

  if (particle.x < 0 || particle.x > width) {
    particle.vx *= -1;
    particle.x = Math.max(0, Math.min(width, particle.x));
  }
  if (particle.y < 0 || particle.y > height) {
    particle.vy *= -1;
    particle.y = Math.max(0, Math.min(height, particle.y));
  }
}

function drawParticle(particle: Particle): void {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fillStyle = props.particleColor;
  ctx.globalAlpha = particle.opacity;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawLines(): void {
  if (!ctx) return;
  const { lineDistance, lineColor, lineOpacity } = props;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < lineDistance) {
        const opacity = (1 - distance / lineDistance) * lineOpacity;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

function animate(): void {
  if (!ctx || reducedMotion) return;

  ctx.clearRect(0, 0, width, height);

  for (const particle of particles) {
    updateParticle(particle);
    drawParticle(particle);
  }

  drawLines();

  animationId = requestAnimationFrame(animate);
}

function handleResize(): void {
  if (!canvasRef.value) return;

  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;

  canvasRef.value.width = width * dpr;
  canvasRef.value.height = height * dpr;
  canvasRef.value.style.width = `${width}px`;
  canvasRef.value.style.height = `${height}px`;

  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  initParticles();
}

function handleReducedMotionChange(e: MediaQueryListEvent): void {
  reducedMotion = e.matches;
  if (reducedMotion && animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  } else if (!reducedMotion && canvasRef.value) {
    animate();
  }
}

onMounted(() => {
  if (!canvasRef.value) return;

  reducedMotion = checkReducedMotion();
  ctx = canvasRef.value.getContext('2d');

  handleResize();
  window.addEventListener('resize', handleResize);

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', handleReducedMotionChange);

  if (!reducedMotion) {
    animate();
  }
});

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  window.removeEventListener('resize', handleResize);

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.removeEventListener('change', handleReducedMotionChange);
});

watch(
  () => props.particleCount,
  () => {
    initParticles();
  }
);
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
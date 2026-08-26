import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
}

@Component({
  selector: 'app-cyber-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <!-- High-Resolution 3D Cyber Room Backdrop -->
      <img
        src="vigilai_cyber_bg.jpg"
        alt="VigilAI Cyber Universe"
        class="w-full h-full object-cover object-center scale-105 filter brightness-50 contrast-125 saturate-125 transform transition-transform duration-1000"
      />

      <!-- Dark Obsidian Cyber Vignette & Depth Mask -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/70 to-[#030712]/80 mix-blend-multiply"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030712_85%)]"></div>

      <!-- Animated Ambient Aurora Light Pulses -->
      <div class="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[140px] animate-pulse-slow"></div>
      <div class="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[160px] animate-pulse-slow"></div>

      <!-- Live 60FPS Interactive Neural Collusion Canvas -->
      <canvas #cyberCanvas class="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"></canvas>

      <!-- Laser Radar Scanline Sweep Effect -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.04] to-transparent h-48 w-full animate-scanline pointer-events-none"></div>

      <!-- Cyber Grid Floor -->
      <div class="absolute bottom-0 left-0 right-0 h-64 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:4rem_2rem] [transform:perspective(500px)_rotateX(60deg)] opacity-30"></div>
    </div>
  `,
  styles: [`
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(1000%); }
    }
    .animate-scanline {
      animation: scanline 8s linear infinite;
    }
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 6s ease-in-out infinite;
    }
  `],
})
export class CyberBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('cyberCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private readonly particleCount = 45;
  private mouseX = 0;
  private mouseY = 0;

  @HostListener('window:resize')
  onResize() {
    this.initCanvasSize();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initCanvasSize();
        this.createParticles();
        this.startAnimationLoop();
      }, 50);
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = canvas.getContext('2d');
  }

  private createParticles() {
    this.particles = [];
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#00f2fe'];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }
  }

  private startAnimationLoop() {
    const animate = () => {
      this.drawFrame();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private drawFrame() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;

    ctx.clearRect(0, 0, width, height);

    // Draw connection links between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Update and draw each particle
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Pulse alpha
      p.alpha += Math.sin(Date.now() * p.pulseSpeed * 0.05) * 0.005;
      const currentAlpha = Math.max(0.2, Math.min(0.9, p.alpha));

      // Draw particle glowing core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = currentAlpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();

      // Reset shadow for performance
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }
  }
}

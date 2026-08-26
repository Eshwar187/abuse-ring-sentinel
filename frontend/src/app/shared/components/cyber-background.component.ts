import { Component, ElementRef, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
  isHub: boolean;
}

interface DataPacket {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
}

@Component({
  selector: 'app-cyber-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <!-- 1. Vibrant 3D Cyber Command Universe -->
      <img
        src="vigilai_cyber_bg.jpg"
        alt="VigilAI Cyber Universe"
        class="w-full h-full object-cover object-center filter brightness-90 contrast-115 saturate-135 transform scale-105 transition-all duration-1000"
      />

      <!-- 2. Cyber Glass Vignette & Depth Mask (Keeps center luminous, fades edges) -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#030712]/90 via-[#030712]/30 to-[#030712]/70"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,#030712_95%)]"></div>

      <!-- 3. Dynamic Laser Grid Moving Floor -->
      <div class="absolute bottom-0 left-0 right-0 h-96 bg-[linear-gradient(to_right,#06b6d420_1px,transparent_1px),linear-gradient(to_bottom,#06b6d420_1px,transparent_1px)] bg-[size:4rem_2.5rem] [transform:perspective(400px)_rotateX(65deg)] opacity-40 animate-grid-drift"></div>

      <!-- 4. Real-Time 60FPS Neural Collusion Network Canvas with Traveling Data Packets -->
      <canvas #cyberCanvas class="absolute inset-0 w-full h-full mix-blend-screen"></canvas>

      <!-- 5. Vertical Laser Radar Sweep Beam -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.08] to-transparent h-64 w-full animate-scanline pointer-events-none"></div>

      <!-- 6. Floating Holographic Shield Badges -->
      <div class="absolute top-16 left-12 xl:left-28 w-28 h-32 border border-cyan-400/30 rounded-3xl bg-cyan-950/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-float hidden md:flex">
        <svg class="w-14 h-14 text-cyan-400 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <div class="absolute top-20 right-12 xl:right-28 w-28 h-32 border border-purple-400/30 rounded-3xl bg-purple-950/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-float-delayed hidden md:flex">
        <svg class="w-14 h-14 text-purple-400 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(1200%); }
    }
    .animate-scanline {
      animation: scanline 6s linear infinite;
    }
    @keyframes grid-drift {
      0% { background-position: 0 0; }
      100% { background-position: 0 50px; }
    }
    .animate-grid-drift {
      animation: grid-drift 4s linear infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(2deg); }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
    @keyframes float-delayed {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-18px) rotate(-2deg); }
    }
    .animate-float-delayed {
      animation: float-delayed 6s ease-in-out 1s infinite;
    }
  `],
})
export class CyberBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('cyberCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private nodes: Node[] = [];
  private packets: DataPacket[] = [];
  private readonly nodeCount = 55;

  @HostListener('window:resize')
  onResize() {
    this.initCanvasSize();
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initCanvasSize();
        this.createNodes();
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

  private createNodes() {
    this.nodes = [];
    const colors = ['#00f2fe', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < this.nodeCount; i++) {
      const isHub = i % 8 === 0;
      this.nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isHub ? 0.4 : 0.9),
        vy: (Math.random() - 0.5) * (isHub ? 0.4 : 0.9),
        radius: isHub ? Math.random() * 3 + 3.5 : Math.random() * 2 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.4,
        pulsePhase: Math.random() * Math.PI * 2,
        isHub,
      });
    }

    // Initialize 16 data packets traveling between nodes
    this.packets = [];
    for (let p = 0; p < 16; p++) {
      this.spawnDataPacket();
    }
  }

  private spawnDataPacket() {
    if (this.nodes.length < 2) return;
    const fromIndex = Math.floor(Math.random() * this.nodes.length);
    let toIndex = Math.floor(Math.random() * this.nodes.length);
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * this.nodes.length);
    }

    this.packets.push({
      fromIndex,
      toIndex,
      progress: 0,
      speed: Math.random() * 0.015 + 0.008,
      color: Math.random() > 0.5 ? '#00f2fe' : '#e879f9',
    });
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

    // 1. Draw glowing connecting collusion lines between nearby nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 160) {
          const alpha = (1 - dist / 160) * 0.45;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = n1.isHub || n2.isHub ? 1.2 : 0.75;
          ctx.stroke();
        }
      }
    }

    // 2. Draw animated electric data packets traveling along lines
    for (let p = this.packets.length - 1; p >= 0; p--) {
      const packet = this.packets[p];
      const from = this.nodes[packet.fromIndex];
      const to = this.nodes[packet.toIndex];

      if (!from || !to) continue;

      packet.progress += packet.speed;
      if (packet.progress >= 1) {
        this.packets.splice(p, 1);
        this.spawnDataPacket();
        continue;
      }

      const px = from.x + (to.x - from.x) * packet.progress;
      const py = from.y + (to.y - from.y) * packet.progress;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = packet.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = packet.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. Update & render each node
    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce/Wrap borders
      if (node.x < 0) node.x = width;
      if (node.x > width) node.x = 0;
      if (node.y < 0) node.y = height;
      if (node.y > height) node.y = 0;

      node.pulsePhase += 0.04;
      const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7;

      // Draw outer glowing halo for hubs
      if (node.isHub) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.5 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35 * pulse;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Draw primary node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = node.alpha * pulse;
      ctx.shadowBlur = node.isHub ? 20 : 12;
      ctx.shadowColor = node.color;
      ctx.fill();

      // Reset
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }
  }
}

import { Component, OnInit, ElementRef, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import cytoscape from 'cytoscape';

import { TransactionService } from '../../core/services/transaction.service';
import { NetworkNode } from '../../core/models/risk.models';

@Component({
  selector: 'app-risk-networks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-full font-mono uppercase">
              BIPARTITE GRAPH INTELLIGENCE
            </span>
          </div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight mt-1.5">Risk Networks & Entity Graph</h2>
          <p class="text-xs text-slate-400 mt-1">
            Interactive heterogeneous relationship graph visualizing entity sharing (Devices, IPs, Payment Tokens, Addresses) between accounts.
          </p>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-3 bg-[#0B132B]/80 p-3 border border-slate-800 rounded-2xl shadow-xl text-xs font-mono backdrop-blur-xl">
          <span class="flex items-center gap-1.5 font-semibold text-rose-400">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span> User Account
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-cyan-400">
            <span class="w-2.5 h-2.5 rounded bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]"></span> Device
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-purple-400">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]"></span> IP Address
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-amber-400">
            <span class="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]"></span> Payment Card
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span> Shipping Addr
          </span>
        </div>
      </div>

      <!-- Graph Container & Inspector Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Canvas (8 cols) -->
        <div class="lg:col-span-8 bg-[#0B132B]/85 border border-slate-800 rounded-3xl shadow-2xl p-5 flex flex-col h-[600px] relative backdrop-blur-xl">
          <!-- Canvas Toolbar -->
          <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 z-10">
            <div class="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Layout: <strong class="text-white">Concentric Heterogeneous Cluster</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="zoomIn()"
                class="w-7 h-7 bg-[#030712] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-200 flex items-center justify-center transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                (click)="zoomOut()"
                class="w-7 h-7 bg-[#030712] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-200 flex items-center justify-center transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <button
                (click)="fitGraph()"
                class="px-2.5 py-1 bg-[#030712] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
              >
                Fit
              </button>
              <button
                (click)="resetLayout()"
                class="px-2.5 py-1 bg-[#030712] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Cytoscape DOM Mount Point -->
          <div #cyContainer class="flex-1 w-full h-full rounded-2xl bg-[#030712]/90 border border-slate-800/80"></div>
        </div>

        <!-- Selected Node Inspector (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          @if (selectedNode) {
            <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl animate-fade-in">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Selected Entity</div>
                  <h3 class="text-sm font-bold font-mono text-white mt-0.5">{{ selectedNode.label }}</h3>
                </div>
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase"
                  [ngClass]="selectedNode.isRisk ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'"
                >
                  {{ selectedNode.isRisk ? 'Abuse Syndicate' : 'Benign Cluster' }}
                </span>
              </div>

              <!-- Node Metadata Properties -->
              <div class="space-y-2.5 text-xs">
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#030712] border border-slate-800 font-mono">
                  <span class="text-slate-400">Entity Type</span>
                  <span class="font-bold text-cyan-300">{{ selectedNode.type }}</span>
                </div>
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#030712] border border-slate-800 font-mono">
                  <span class="text-slate-400">Entity ID</span>
                  <span class="text-slate-200 truncate max-w-[160px]">{{ selectedNode.id }}</span>
                </div>
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#030712] border border-slate-800 font-mono">
                  <span class="text-slate-400">Connected Degree</span>
                  <span class="font-bold text-purple-400">{{ selectedNode.degree }} connections</span>
                </div>
              </div>

              <!-- Contextual Action -->
              <div class="pt-2">
                <p class="text-[11px] text-slate-400 leading-relaxed">
                  Click and drag any node to explore graph topology. Double click to isolate connected subgraphs.
                </p>
              </div>
            </div>
          } @else {
            <div class="bg-[#0B132B]/85 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center text-slate-400 space-y-3 backdrop-blur-xl">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-xl">
                🕸️
              </div>
              <div class="text-sm font-bold text-white">No Entity Selected</div>
              <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Click on any node in the graph (User, Device, IP, Payment Card) to inspect its connection topology and collusion degree.
              </p>
            </div>
          }

          <!-- Graph Explanation Card -->
          <div class="bg-[#0B132B]/85 border border-cyan-500/30 rounded-3xl p-5 text-xs text-slate-300 space-y-2.5 shadow-xl backdrop-blur-xl">
            <div class="font-bold text-cyan-300 flex items-center gap-2 font-mono">
              <span>💡 Relational Graph Insight</span>
            </div>
            <p class="text-[11px] leading-relaxed text-slate-300">
              Notice how the <strong>Abuse Syndicate (top)</strong> forms a dense star/mesh cluster with 4 user accounts converging on a single device and virtual payment card.
            </p>
            <p class="text-[11px] leading-relaxed text-slate-400">
              Conversely, the <strong>Family Household (bottom)</strong> safely shares a home IP and address while maintaining distinct devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RiskNetworksComponent implements OnInit, OnDestroy {
  @ViewChild('cyContainer', { static: true }) cyContainerRef!: ElementRef;

  private txService = inject(TransactionService);
  private cy?: cytoscape.Core;

  selectedNode: NetworkNode | null = null;

  ngOnInit(): void {
    setTimeout(() => this.initCytoscape(), 50);
  }

  ngOnDestroy(): void {
    this.cy?.destroy();
  }

  private initCytoscape() {
    if (!this.cyContainerRef) return;

    const { nodes, edges } = this.txService.getNetworkGraph();

    const cyElements: cytoscape.ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          nodeType: n.type,
          isRisk: n.isRisk,
          degree: n.degree,
          rawNode: n,
        },
      })),
      ...edges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          edgeType: e.type,
        },
      })),
    ];

    this.cy = cytoscape({
      container: this.cyContainerRef.nativeElement,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#F8FAFC',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#475569',
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': '#0F172A',
          },
        },
        {
          selector: 'node[nodeType = "USER"]',
          style: {
            'background-color': '#F43F5E',
            'shape': 'ellipse',
            'width': 32,
            'height': 32,
            'border-color': '#881337',
          },
        },
        {
          selector: 'node[nodeType = "DEVICE"]',
          style: {
            'background-color': '#06B6D4',
            'shape': 'round-rectangle',
            'width': 30,
            'height': 30,
            'border-color': '#164E63',
          },
        },
        {
          selector: 'node[nodeType = "IP"]',
          style: {
            'background-color': '#A855F7',
            'shape': 'diamond',
            'width': 30,
            'height': 30,
            'border-color': '#581C87',
          },
        },
        {
          selector: 'node[nodeType = "PAYMENT"]',
          style: {
            'background-color': '#F59E0B',
            'shape': 'rectangle',
            'width': 32,
            'height': 24,
            'border-color': '#78350F',
          },
        },
        {
          selector: 'node[nodeType = "ADDRESS"]',
          style: {
            'background-color': '#10B981',
            'shape': 'hexagon',
            'width': 30,
            'height': 30,
            'border-color': '#064E3B',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#334155',
            'curve-style': 'bezier',
            'opacity': 0.6,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#00F2FE',
          },
        },
      ],
      layout: {
        name: 'concentric',
        concentric: (node: any) => {
          return node.data('isRisk') ? 2 : 1;
        },
        levelWidth: () => 1,
        padding: 50,
        animate: true,
        animationDuration: 800,
      } as any,
    });

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      this.selectedNode = node.data('rawNode');
    });

    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.selectedNode = null;
      }
    });
  }

  zoomIn() {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() * 1.2);
  }

  zoomOut() {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() * 0.8);
  }

  fitGraph() {
    if (!this.cy) return;
    this.cy.fit();
  }

  resetLayout() {
    if (!this.cy) return;
    this.cy.layout({
      name: 'concentric',
      padding: 50,
      animate: true,
      animationDuration: 500,
    } as any).run();
  }
}

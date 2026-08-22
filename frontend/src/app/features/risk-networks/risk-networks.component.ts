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
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-surface-900 tracking-tight">Risk Networks & Entity Graph</h2>
          <p class="text-xs text-surface-500 mt-1">
            Interactive heterogeneous relationship graph visualizing entity sharing (Devices, IPs, Payment Tokens, Addresses) between accounts.
          </p>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-3 bg-white p-2.5 border border-surface-200 rounded-lg shadow-sm text-xs font-mono">
          <span class="flex items-center gap-1.5 font-semibold text-rose-700">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> User Account
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-blue-700">
            <span class="w-2.5 h-2.5 rounded bg-blue-500"></span> Device Fingerprint
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-purple-700">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> IP Address
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-amber-700">
            <span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Payment Card
          </span>
          <span class="flex items-center gap-1.5 font-semibold text-emerald-700">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Shipping Addr
          </span>
        </div>
      </div>

      <!-- Graph Container & Inspector Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Canvas (8 cols) -->
        <div class="lg:col-span-8 bg-white border border-surface-200 rounded-lg shadow-card p-4 flex flex-col h-[580px] relative">
          <!-- Canvas Toolbar -->
          <div class="flex items-center justify-between pb-3 mb-2 border-b border-surface-100 z-10">
            <div class="flex items-center gap-1.5 text-xs font-medium text-surface-600">
              <span>Layout: <strong class="text-surface-900 font-mono">Concentric Heterogeneous</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="zoomIn()"
                class="px-2 py-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded text-xs font-mono font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                (click)="zoomOut()"
                class="px-2 py-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded text-xs font-mono font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <button
                (click)="fitGraph()"
                class="px-2.5 py-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded text-xs font-medium"
              >
                Fit
              </button>
              <button
                (click)="resetLayout()"
                class="px-2.5 py-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded text-xs font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Cytoscape DOM Mount Point -->
          <div #cyContainer class="flex-1 w-full h-full"></div>
        </div>

        <!-- Selected Node Inspector (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          @if (selectedNode) {
            <div class="bg-white border border-surface-200 rounded-lg p-5 shadow-card space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-surface-200">
                <div>
                  <div class="text-[10px] font-bold text-surface-400 uppercase">Selected Entity</div>
                  <h3 class="text-sm font-bold font-mono text-surface-900 mt-0.5">{{ selectedNode.label }}</h3>
                </div>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase"
                  [ngClass]="selectedNode.isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'"
                >
                  {{ selectedNode.isRisk ? 'Abuse Syndicate' : 'Benign Cluster' }}
                </span>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between py-1.5 border-b border-surface-100">
                  <span class="text-surface-500 font-medium">Entity Type</span>
                  <span class="font-mono font-bold text-surface-900">{{ selectedNode.type }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-surface-100">
                  <span class="text-surface-500 font-medium">Internal ID</span>
                  <span class="font-mono text-surface-700">{{ selectedNode.id }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-surface-100">
                  <span class="text-surface-500 font-medium">Degree of Connectivity</span>
                  <span class="font-mono font-bold" [ngClass]="selectedNode.degree! >= 3 ? 'text-rose-600' : 'text-surface-800'">
                    {{ selectedNode.degree }} connections
                  </span>
                </div>
              </div>

              @if (selectedNode.details) {
                <div>
                  <h4 class="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-2">Entity Attributes</h4>
                  <div class="bg-surface-50 p-3 rounded-lg border border-surface-200 font-mono text-xs text-surface-800 space-y-1">
                    @for (item of selectedNode.details | keyvalue; track item.key) {
                      <div class="flex justify-between">
                        <span class="text-surface-500">{{ item.key }}:</span>
                        <span class="font-bold">{{ item.value }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-white border border-surface-200 rounded-lg p-6 shadow-card text-center text-surface-400">
              <div class="text-3xl mb-2">🕸️</div>
              <div class="text-xs font-bold text-surface-700">Entity Inspector</div>
              <p class="text-[11px] text-surface-400 mt-1">
                Click any User, Device, IP, or Payment node in the graph to inspect connection degrees and risk evidence.
              </p>
            </div>
          }

          <!-- Graph Explanation Card -->
          <div class="bg-surface-50 border border-surface-200 rounded-lg p-4 text-xs text-surface-600 space-y-2">
            <div class="font-bold text-surface-900 flex items-center gap-1.5">
              <span>💡 Relational Graph Insight</span>
            </div>
            <p class="text-[11px]">
              Notice how the <strong>Abuse Syndicate (top)</strong> forms a dense star/mesh cluster with 4 user accounts converging on a single device and virtual payment card.
            </p>
            <p class="text-[11px]">
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
            'color': '#1E293B',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'background-color': '#94A3B8',
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': '#FFFFFF',
          },
        },
        {
          selector: 'node[nodeType = "USER"]',
          style: {
            'background-color': '#E11D48',
            'shape': 'ellipse',
            'width': 32,
            'height': 32,
          },
        },
        {
          selector: 'node[nodeType = "DEVICE"]',
          style: {
            'background-color': '#3B82F6',
            'shape': 'round-rectangle',
          },
        },
        {
          selector: 'node[nodeType = "IP"]',
          style: {
            'background-color': '#8B5CF6',
            'shape': 'diamond',
          },
        },
        {
          selector: 'node[nodeType = "PAYMENT"]',
          style: {
            'background-color': '#F59E0B',
            'shape': 'tag',
          },
        },
        {
          selector: 'node[nodeType = "ADDRESS"]',
          style: {
            'background-color': '#10B981',
            'shape': 'hexagon',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#CBD5E1',
            'curve-style': 'bezier',
            'opacity': 0.8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#0F172A',
            'border-width': 4,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        componentSpacing: 80,
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

    // Default select first abuse node
    if (nodes.length > 0) {
      this.selectedNode = nodes[0];
    }
  }

  zoomIn() {
    this.cy?.zoom(this.cy.zoom() * 1.25);
  }

  zoomOut() {
    this.cy?.zoom(this.cy.zoom() * 0.8);
  }

  fitGraph() {
    this.cy?.fit(undefined, 30);
  }

  resetLayout() {
    this.cy?.layout({ name: 'cose', animate: true } as any).run();
  }
}

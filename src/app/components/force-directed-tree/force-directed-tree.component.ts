import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { TreeNode } from '../../modules/tree-visualization/interfaces/interfaces';

interface GraphNode {
  id: string;
  name: string;
  level: number;
  type?: string;
  amount?: number;
  state?: string;
  note?: string;
  locked?: boolean;
  selected?: boolean;
  hasMultipleParents?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  originalX?: number;
  originalY?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type?: string;
}

@Component({
  selector: 'app-force-directed-tree',
  template: `
    <div class="controls">
      <button (click)="centerGraph()">Center Graph</button>
      <button (click)="resetSimulation()">Reset Simulation</button>
    </div>
    <div #graphContainer class="graph-container"></div>
  `,
  styles: [`
    .graph-container {
      width: 100%;
      height: 600px;
      border: 1px solid #ccc;
      overflow: hidden;
    }
    .controls {
      margin-bottom: 10px;
    }
    .controls button {
      margin-right: 10px;
      padding: 5px 10px;
    }
    .node rect {
      stroke-width: 2px;
    }
    .node text {
      font: 12px sans-serif;
      pointer-events: none;
    }
    .link {
      stroke-opacity: 0.6;
    }
    .node.company rect {
      fill: #e8f5e9;
      stroke: #81c784;
    }
    .node.credit rect {
      fill: #f3e5f5;
      stroke: #ba68c8;
    }
    .node.control rect {
      fill: #e3f2fd;
      stroke: #64b5f6;
    }
    .node.selected rect {
      stroke: #ff6d00;
      stroke-width: 3px;
    }
    .tooltip {
      position: absolute;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      max-width: 200px;
      z-index: 1000;
    }
  `]
})
export class ForceDirectedTreeComponent implements OnInit {
  @ViewChild('graphContainer', { static: true })
  private graphContainer!: ElementRef;

  // Graph elements
  private svg: any;
  private simulation: any;
  private nodeElements: any;
  private linkElements: any;
  private zoomGroup: any;
  private width!: number;
  private height!: number;
  private tooltip: any;

  // Data for the graph
  private nodes: GraphNode[] = [];
  private links: GraphLink[] = [];
  private nodeWidth = 220;
  private nodeHeight = 120;
  private draggingNode: GraphNode | null = null;

  // Tree layout parameters
  private horizontalSpacing = 300;
  private verticalSpacing = 150;
  private rootNodeX = 0;
  private rootNodeY = 0;

  constructor() { }

  ngOnInit() {
    this.processTreeData();
    this.initializeGraph();
    this.positionNodesAsTree();
  }

  /**
   * Process the hierarchical tree data into flat nodes and links for the force graph
   */
  private processTreeData(): void {
    const treeData = this.loadTreeData();

    // Create a map to track nodes we've seen before (for multi-parent case)
    const nodeMap = new Map<string, GraphNode>();

    // Process nodes and links recursively
    const processNode = (node: TreeNode, parentId?: string) => {
      // Create or retrieve the graph node
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, {
          id: node.id,
          name: node.name,
          level: node.level || 0,
          type: node.type,
          amount: node.amount,
          state: node.state,
          note: node.note,
          locked: node.locked,
          selected: node.selected,
          hasMultipleParents: node.hasMultipleParents
        });
      } else if (parentId) {
        // If we've seen this node before and it has a parent, it's a multi-parent node
        nodeMap.get(node.id)!.hasMultipleParents = true;
      }

      // Create a link if there's a parent
      if (parentId) {
        this.links.push({
          source: parentId,
          target: node.id
        });
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          processNode(child, node.id);
        }
      }
    };

    // Start processing from the root
    processNode(treeData);

    // Convert node map to array
    this.nodes = Array.from(nodeMap.values());
  }

  /**
   * Initialize the force-directed graph
   */
  private initializeGraph(): void {
    // Get container dimensions
    const container = this.graphContainer.nativeElement;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height]);

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.zoomGroup.attr('transform', event.transform);
      });

    this.svg.call(zoom);
    this.zoomGroup = this.svg.append('g');

    // Setup tooltip
    this.tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Initialize force simulation
    this.simulation = d3.forceSimulation(this.nodes)
      // .force('link', d3.forceLink(this.links)
      //   .id((d: any) => d.id)
      //   .distance(this.horizontalSpacing / 2) // Distance between connected nodes
      // )
      // .force('charge', d3.forceManyBody().strength(-800)) // Repulsion between nodes
      // .force('center', d3.forceCenter(this.width/2, this.height/2))
      .on('tick', () => this.updatePositions());

    // Create the links
    this.linkElements = this.zoomGroup.selectAll('.link')
      .data(this.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .style('stroke', '#999')
      .style('stroke-width', 2)
      .style('fill', 'none');

    // Create the nodes
    this.nodeElements = this.zoomGroup.selectAll('.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', (d: GraphNode) => {
        let classes = 'node';
        console.log(d);
        if (d.level === 0) classes += ' company';
        else if (d.type === '額度') classes += ' credit';
        else if (d.type === '合控') classes += ' control';
        if (d.selected) classes += ' selected';
        return classes;
      })
      .call(this.dragBehavior())
      .on('click', (event: any, d: GraphNode) => this.handleNodeClick(event, d))
      .on('mouseover', (event: any, d: GraphNode) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Add rectangles to node groups with proper styling
    this.nodeElements.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)
      .attr('y', -this.nodeHeight / 2)
      .attr('rx', 5) // Add rounded corners
      .attr('ry', 5)
      .attr('class', (d: GraphNode) => {
        let classes = 'node';
        console.log(d);
        if (d.level === 0) classes += ' company';
        else if (d.type === '額度') classes += ' credit';
        else if (d.type === '合控') classes += ' control';
        if (d.selected) classes += ' selected';
        return classes;
      });

    // Add texts to nodes
    this.addNodeLabels();

    // Initial centering of the graph
    setTimeout(() => this.centerGraph(), 100);
  }

  /**
   * Position nodes in a tree-like structure
   */
  private positionNodesAsTree(): void {
    // Create a hierarchical tree layout for initial positioning
    const treeData = this.loadTreeData();
    const root = d3.hierarchy(treeData) as d3.HierarchyNode<unknown>;

    // Calculate tree layout (without rendering it)
    const treeLayout = d3.tree()
      .nodeSize([this.horizontalSpacing, this.verticalSpacing])
      .separation((a, b) => {
        // Adjust separation based on whether nodes have the same parent
        return a.parent === b.parent ? 1 : 1;
        // return a.parent === b.parent ? 1 : 1.2; TODO
      });

    treeLayout(root);

    // Calculate center offset
    this.rootNodeX = this.width / 2;
    this.rootNodeY = 100; // Top padding

    // Map the tree layout positions to our flat nodes
    const nodeById = new Map(this.nodes.map(node => [node.id, node]));

    // Track which nodes have been positioned already
    const positionedNodes = new Set<string>();

    root.descendants().forEach((hierarchyNode: any) => {
      const node = nodeById.get(hierarchyNode.data.id);
      if (node && !positionedNodes.has(node.id)) {
        // Set initial position
        node.x = this.rootNodeX + hierarchyNode.x;
        node.y = this.rootNodeY + hierarchyNode.y;
        console.log(this.rootNodeX, this.rootNodeY, hierarchyNode.x, hierarchyNode.y, node.x, node.y);

        // Store original position
        node.originalX = node.x;
        node.originalY = node.y;

        // Fix the node position
        node.fx = node.x;
        node.fy = node.y;

        // Mark this node as positioned
        positionedNodes.add(node.id);
      }
    });

    // Handle special case for node with multiple parents - only position it once
    const multiParentNodes = this.nodes.filter(node => node.hasMultipleParents);

    for (const multiParentNode of multiParentNodes) {
      // Only process if this node hasn't been positioned yet
      if (!positionedNodes.has(multiParentNode.id)) {
        // Find all parent links for this node
        const parentLinks = this.links.filter(link =>
          (link.target.toString() === multiParentNode.id) ||
          (link.target === multiParentNode.id)
        );

        if (parentLinks.length > 0) {
          // For visualization, get a consistent parent (first one in the links array)
          const firstParentId = parentLinks[0].source.toString();
          const firstParent = nodeById.get(firstParentId);

          if (firstParent) {
            // Position relative to this parent
            multiParentNode.x = firstParent.x;
            multiParentNode.y = (firstParent.y || 0) + this.verticalSpacing;

            // Store original position
            multiParentNode.originalX = multiParentNode.x;
            multiParentNode.originalY = multiParentNode.y;

            // Fix position
            multiParentNode.fx = multiParentNode.x;
            multiParentNode.fy = multiParentNode.y;

            // Mark as positioned
            positionedNodes.add(multiParentNode.id);
          }
        }
      }
    }

    // Log completion and update positions
    console.log('positionNodeAsTree');
    this.updatePositions();
  }

  /**
   * Add labels to the nodes based on their type
   */
  private addNodeLabels(): void {
    // Add name/title
    this.nodeElements.append('text')
      .attr('dy', -this.nodeHeight / 2 + 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-name')
      .text((d: GraphNode) => {
        if (d.level === 0) {
          return '提案名稱: ' + d.name;
        }
        return '額度編號: ' + d.name;
      })
      .style('fill', '#333')
      .style('font-weight', 'bold');

    // Add type
    this.nodeElements.append('text')
      .attr('dy', -this.nodeHeight / 2 + 50)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-type')
      .text((d: GraphNode) => {
        if (d.type) {
          return '額度種類: ' + (d.type || '');
        }
        return '';
      })
      .style('fill', '#555');

    // Add currency
    this.nodeElements.append('text')
      .attr('dy', -this.nodeHeight / 2 + 70)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-currency')
      .text((d: GraphNode) => {
        if (d.level !== 0) {
          return '幣別: 新台幣';
        }
        return '';
      })
      .style('fill', '#555');

    // Add amount
    this.nodeElements.append('text')
      .attr('dy', -this.nodeHeight / 2 + 90)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-amount')
      .text((d: GraphNode) => {
        if (d.type && d.amount) {
          return `金額: ${d.amount.toLocaleString()}元`;
        }
        return '';
      })
      .style('fill', '#555');

    // Add state
    this.nodeElements.append('text')
      .attr('dy', -this.nodeHeight / 2 + 110)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-state')
      .text((d: GraphNode) => {
        if (d.state) {
          return '帳務狀態: ' + (d.state || '');
        }
        return '';
      })
      .style('fill', '#555');

    // Add note indicator if the node has a note
    this.nodeElements.filter((d: GraphNode) => !!d.note)
      .append('text')
      .attr('class', 'note-indicator')
      .attr('x', this.nodeWidth / 2 - 15)
      .attr('y', -this.nodeHeight / 2 + 15)
      .text('📝')
      .style('font-size', '14px')
      .style('cursor', 'help');
  }

  /**
   * Update node and link positions on each simulation tick
   */
  private updatePositions(): void {
    console.log('updatePositions');
    // Update node positions
    this.nodeElements.attr('transform', (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`);

    // Update link paths
    this.linkElements.attr('d', (d: any) => {
      const sourceNode = this.nodes.find(n => n.id === (d.source.id || d.source));
      const targetNode = this.nodes.find(n => n.id === (d.target.id || d.target));

      if (!sourceNode || !targetNode) return '';

      const sourceX = sourceNode.x || 0;
      const sourceY = sourceNode.y || 0;
      const targetX = targetNode.x || 0;
      const targetY = targetNode.y || 0;

      // If the target has multiple parents, use a more curved path
      if (targetNode.hasMultipleParents) {
        // Check if this is the second link to this node
        const isSecondLink = this.links.find(link =>
          link.target === targetNode.id &&
          link.source !== (d.source.id || d.source));

        if (isSecondLink) {
          // More curved for the second link
          return `M${sourceX},${sourceY}
                  C${sourceX + 100},${(sourceY + targetY) / 2 - 50}
                  ${targetX + 100},${(sourceY + targetY) / 2 + 50}
                  ${targetX},${targetY}`;
        } else {
          // Slightly curved for the first link
          return `M${sourceX},${sourceY}
                  C${sourceX - 100},${(sourceY + targetY) / 2 - 50}
                  ${targetX - 100},${(sourceY + targetY) / 2 + 50}
                  ${targetX},${targetY}`;
        }
      } else {
        // Standard curve for normal links
        return `M${sourceX},${sourceY}
                C${sourceX},${(sourceY + targetY) / 2}
                ${targetX},${(sourceY + targetY) / 2}
                ${targetX},${targetY}`;
      }
    });
  }

  /**
   * Handle node click event
   */
  private handleNodeClick(event: MouseEvent, node: GraphNode): void {
    event.stopPropagation();

    // Deselect all nodes
    this.nodeElements.classed('selected', false);

    // Select the clicked node
    const clickedElement = d3.select(event.currentTarget as any);
    clickedElement.classed('selected', true);

    // Update the node data
    this.nodes.forEach(n => {
      n.selected = n.id === node.id;
    });
  }

  /**
   * Show tooltip with node details
   */
  private showTooltip(event: MouseEvent, node: GraphNode): void {
    // Only show tooltip if node has a note
    if (!node.note) return;

    this.tooltip
      .html(`<strong>備註:</strong> ${node.note}`)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px')
      .style('opacity', 1);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('opacity', 0);
  }

  /**
   * Define drag behavior for nodes that only moves the dragged node
   */
  private dragBehavior(): any {
    return d3.drag()
      .on('start', (event: any, d: any) => {
        event.sourceEvent.stopPropagation();
        // Set current node as dragging node
        this.draggingNode = d;

        // Remember original position
        if (d.originalX === undefined) {
          d.originalX = d.x;
          d.originalY = d.y;
        }

        // Temporarily remove fixed position to allow movement
        const temp = { x: d.x, y: d.y };
        d.fx = null;
        d.fy = null;
        d.x = temp.x;
        d.y = temp.y;

        // Allow some simulation during drag
        this.simulation.alpha(0.1).restart();
      })
      .on('drag', (event: any, d: any) => {
        // Update position of the dragged node
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        // Clear dragging status
        this.draggingNode = null;

        // Start returning to original position with animation
        d.fx = null;
        d.fy = null;

        // Apply spring force to pull node back to original position
        const restoreForce = d3.forceSimulation([d])
          .force('restore-x', d3.forceX(d.originalX).strength(0.2))
          .force('restore-y', d3.forceY(d.originalY).strength(0.2));

        // Run a few ticks to animate the return
        for (let i = 0; i < 50; i++) {
          restoreForce.tick();
        }

        // When animation is done, fix the node at its original position
        setTimeout(() => {
          d.fx = d.originalX;
          d.fy = d.originalY;
          this.updatePositions();
        }, 300);

        // Temporarily restart main simulation to handle any adjustments
        this.simulation.alpha(0.1).restart();
      });
  }

  /**
   * Center the graph in the viewport
   */
  public centerGraph(): void {
    // Calculate graph bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.nodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      minX = Math.min(minX, x - this.nodeWidth/2);
      maxX = Math.max(maxX, x + this.nodeWidth/2);
      minY = Math.min(minY, y - this.nodeHeight/2);
      maxY = Math.max(maxY, y + this.nodeHeight/2);
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate center zoom transform
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const scale = Math.min(
      this.width / graphWidth,
      this.height / graphHeight,
      1
    );

    // Apply zoom transform
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
        .translate(this.width/2 - centerX * scale, this.height/2 - centerY * scale)
        .scale(scale)
    );
  }

  /**
   * Reset the simulation and position nodes as a tree
   */
  public resetSimulation(): void {
    // Stop any ongoing simulations
    this.simulation.stop();

    // Clear all fixed positions
    this.nodes.forEach(node => {
      node.fx = null;
      node.fy = null;
    });

    // Re-apply tree positions
    this.positionNodesAsTree();

    // Center the graph
    this.centerGraph();

    // Restart simulation with low alpha to adjust links gently
    this.simulation.alpha(0.3).restart();

    // Then stop and fix all positions after a brief adjustment period
    setTimeout(() => {
      this.simulation.stop();
      this.nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
        node.originalX = node.x;
        node.originalY = node.y;
      });
      this.updatePositions();
    }, 500);
  }

  /**
   * Load the tree data
   */
  public loadTreeData(): TreeNode {
    return {
      id: '1',
      name: '艾蕙服飾開發有限公司',
      level: 0,
      children: [
        {
          id: '2',
          name: 'P250001',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '額度',
          amount: 2000, // 5億
          state: '新增',
          children: []
        },
        {
          id: '3',
          name: 'P250002',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '合控',
          amount: 500, // 1.5億
          note: '備註測試',
          children: [
            {
              id: '5',
              name: 'P250003',
              parentId: '3',
              level: 2,
              locked: false,
              selected: false,
              reports: [],
              type: '額度',
              amount: 1000, // 2億
              state: '新增',
              children: []
            }
          ]
        },
        {
          id: '4',
          name: 'P250004',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '合控',
          amount: 1300, // 2億
          children: [{
            id: '6',
            name: 'P250005',
            parentId: '1',
            level: 2,
            locked: false,
            selected: false,
            reports: [],
            type: '額度',
            amount: 1000, // 5億
            state: '既有',
            children: [
              { // Node with multiple parents
                id: '8',
                name: 'P250007',
                parentId: '7',
                level: 3,
                locked: false,
                selected: false,
                reports: [],
                type: '額度',
                amount: 700, // 5億
                state: '既有',
                hasMultipleParents: true,
                children: []
              }
            ]
          }, {
            id: '7',
            name: 'P250006',
            parentId: '4',
            level: 2,
            locked: false,
            selected: false,
            reports: [],
            type: '合控',
            amount: 1000, // 2億
            children: [{
              id: '8',
              name: 'P250007',
              parentId: '7',
              level: 3,
              locked: false,
              selected: false,
              reports: [],
              type: '額度',
              amount: 700, // 5億
              state: '既有',
              hasMultipleParents: true,
              children: []
            }, {
              id: '9',
              name: 'P250008',
              parentId: '7',
              level: 3,
              locked: false,
              selected: false,
              reports: [],
              type: '額度',
              amount: 800, // 5億
              state: '既有',
              children: []
            }],
          }],
        }
      ]
    } as TreeNode;
  }
}

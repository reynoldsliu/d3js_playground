// src/app/components/hybrid-graph/hybrid-graph.component.ts
import {Component, ElementRef, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import * as d3 from 'd3';
import {
  TreeNode,
  ForceNode,
  ForceLink,
  ForceGraph,
  HybridGraph, MixNode
} from '../../modules/mix-tree-force/models/mix-interface';
import {MixTreeForceService} from '../../modules/mix-tree-force/services/mix-tree-force.service';
import {TreeDataService} from "../../modules/tree-visualization/services/tree-data-service";

@Component({
  selector: 'app-mix-tree-force',
  templateUrl: './mix-tree-force.component.html',
  styleUrls: ['./mix-tree-force.component.scss']
})
export class MixTreeForceComponent implements OnInit, OnDestroy {
  @ViewChild('graphContainer', {static: true})
  private graphContainer!: ElementRef;

  // Graph elements - with correct typing
  private svg!: d3.Selection<SVGSVGElement, unknown, any, any>;
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  // Tree elements
  private treeLayout!: d3.TreeLayout<unknown>;
  private treeRoot!: d3.HierarchyNode<unknown>;
  private treeNodes!: d3.Selection<SVGGElement, d3.HierarchyNode<unknown>, SVGGElement, unknown>;
  private treeLinks!: d3.Selection<SVGPathElement, d3.HierarchyLink<unknown>, SVGGElement, unknown>;

  // Force simulations
  private forceSimulations: Map<string, d3.Simulation<ForceNode, ForceLink>> = new Map();

  // Dimensions
  private width = 1200;
  private height = 900;
  private nodeWidth = 180;
  private nodeHeight = 100;
  private forceNodeRadius = 20;
  private forceNodeWidth = 160;
  private forceNodeHeight = 80;

  // Data
  private hybridGraph: HybridGraph | null = null;

  // Subscriptions
  private subscriptions = new Subscription();

  constructor(private mixTreeForceService: MixTreeForceService,
              private treeDataService: TreeDataService,) {
  }

  ngOnInit(): void {
    // Initialize the SVG
    this.initializeSvg();

    // Subscribe to graph data
    this.subscriptions.add(
      this.mixTreeForceService.hybridGraph$.subscribe(graph => {
        if (graph) {
          this.hybridGraph = graph;
          this.renderGraph();
        }
      })
    );

    // Load sample data
    this.mixTreeForceService.loadHybridGraph(
      this.mixTreeForceService.generateSampleHybridGraph()
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();

    // Stop all force simulations
    this.forceSimulations.forEach(simulation => simulation.stop());
  }

  /**
   * Initialize the SVG canvas and zoom behavior
   */
  private initializeSvg(): void {
    // Create SVG element with proper typing
    this.svg = d3.select<SVGSVGElement, unknown>(this.graphContainer.nativeElement)
      .append<SVGSVGElement>('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Setup zoom behavior with proper typing
    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.mainGroup.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create main group with proper typing - for vertical tree, center horizontally
    this.mainGroup = this.svg.append<SVGGElement>('g')
      .attr('transform', `translate(${this.width / 2}, ${this.nodeHeight * 2})`);
  }

  /**
   * Render the hybrid graph
   */
  private renderGraph(): void {
    if (!this.hybridGraph) return;

    // Clear existing graph
    this.mainGroup.selectAll('*').remove();

    // Stop any existing simulations
    this.forceSimulations.forEach(simulation => simulation.stop());
    this.forceSimulations.clear();

    // Create hierarchical representation of the tree
    this.treeRoot = d3.hierarchy<unknown>(this.hybridGraph.tree);

    // Create tree layout - adjusted for vertical orientation
    this.treeLayout = this.mixTreeForceService.createTreeLayout(
      this.width,
      this.height,
      [this.nodeWidth * 1.2, this.nodeHeight * 2]
    );

    // Apply layout to root
    this.treeLayout(this.treeRoot);

    // Create tree links
    this.renderTreeLinks();

    // Create tree nodes
    this.renderTreeNodes();

    // Render force graphs inside container nodes
    this.renderForceGraphs();

    // Center the graph
    this.centerGraph();
  }

  /**
   * Render tree links - updated for vertical tree
   */
  private renderTreeLinks(): void {
    this.treeLinks = this.mainGroup.append('g')
      .attr('class', 'tree-links')
      .selectAll('path')
      .data(this.treeRoot.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      // .attr('fill','none')
      .attr('d', (d: any) => {
        // For vertical tree layout
        console.log(d.source, d.target)
        const source = d.source;
        const target = d.target;
        return `
          M${source.x},${source.y}
          L${target.x},${target.y}
        `;
        // return `
        //   M ${source.x},${source.y}
        //   C ${source.x},${((source.y||0) + (target.y||0)) / 2}
        //     ${target.x},${((source.y||0) + (target.y||0)) / 2}
        //      ${target.x},${target.y}
        // `;
      });
  }

  /**
   * Render tree nodes with proper class structure matching the SCSS
   */
  private renderTreeNodes(): void {
    // Create node groups
    this.treeNodes = this.mainGroup.append('g')
      .attr('class', 'tree-nodes')
      .selectAll('g')
      .data(this.treeRoot.descendants())
      .enter()
      .append('g')
      .attr('class', (d: d3.HierarchyNode<unknown>) => {
        const nodeData = d.data as TreeNode;
        let classes = 'node';

        // Add type class matching SCSS structure
        if (nodeData.level === 0) {
          classes += ' company';
        } else if (nodeData.type === '額度') {
          classes += ' credit';
        } else if (nodeData.type === '合控') {
          classes += ' control';
        }

        // Add selected state if applicable
        if (nodeData.selected) {
          classes += ' selected';
        }

        // Add force container class if applicable
        if (nodeData.forceGraphId) {
          classes += ' force-container';
        }

        return classes;
      })
      .attr('transform', (d: d3.HierarchyNode<unknown>) => `translate(${d.x},${d.y})`)
      .on('click', (event, d) => this.handleNodeClick(event, d));

    // Add rectangles - follows SCSS structure exactly
    this.treeNodes.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)
      .attr('y', -this.nodeHeight / 2)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('class', (d: d3.HierarchyNode<unknown>) => {
        const nodeData = d.data as TreeNode;
        let classes = 'node';

        // Add type class matching SCSS structure
        if (nodeData.level === 0) {
          classes += ' company';
        } else if (nodeData.type === '額度') {
          classes += ' credit';
        } else if (nodeData.type === '合控') {
          classes += ' control';
        }

        // Add selected state if applicable
        if (nodeData.selected) {
          classes += ' selected';
        }

        // Add force container class if applicable
        if (nodeData.forceGraphId) {
          classes += ' force-container';
        }
        console.log('rect classes:' + classes);
        return classes;
      });

    // Add name text with proper class for SCSS styling
    this.treeNodes.append('text')
      .attr('dy', '-1.5em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-name')
      .text((d: d3.HierarchyNode<unknown>) => {
        const nodeData = d.data as TreeNode;
        return nodeData.name;
      });

    // Add type text with proper class for SCSS styling
    this.treeNodes.append('text')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-type')
      .text((d: d3.HierarchyNode<unknown>) => {
        const nodeData = d.data as TreeNode;
        return nodeData.type || '';
      });

    // Add special indicator for force container nodes
    this.treeNodes.filter((d: d3.HierarchyNode<unknown>) => {
      if ((d.data as TreeNode).forceGraphId) {
        return true;
      }
      return false;
    })
      .append('circle')
      .attr('class', 'force-indicator')
      .attr('r', 8)
      .attr('cx', this.nodeWidth / 2 - 10)
      .attr('cy', -this.nodeHeight / 2 + 10);
  }

  /**
   * Render force-directed graphs with proper class structure matching the SCSS
   */
  private renderForceGraphs(): void {
    // Find nodes that contain force graphs
    const containerNodes = this.mixTreeForceService.findForceContainerNodes(this.hybridGraph!.tree);

    containerNodes.forEach(containerNode => {
      if (!containerNode.forceGraphId) return;

      const forceGraph = this.mixTreeForceService.getForceGraphById(containerNode.forceGraphId);
      if (!forceGraph) return;

      // Find the D3 node that corresponds to this container
      const d3Node = this.treeNodes.filter((d: d3.HierarchyNode<unknown>) =>
        (d.data as TreeNode).id === containerNode.id
      );

      if (d3Node.empty()) return;

      // Get the actual D3 node data
      const hierarchyNode = d3Node.datum() as d3.HierarchyNode<TreeNode>;

      // Extract tree position - D3 hierarchy nodes have x, y properties after layout
      const treeX = hierarchyNode.x || 0;
      const treeY = hierarchyNode.y || 0;

      console.log(`Tree node ${containerNode.id} position: x=${treeX}, y=${treeY}`);

      // Convert container node properly
      const containerForceNode = this.mixTreeForceService.convertTreeNodeToForceNode(containerNode);
      containerForceNode.x = 0; // Center of the force graph group
      containerForceNode.y = 0;

      // Create all nodes array BEFORE creating simulation
      const allNodes = [...forceGraph.nodes, containerForceNode];

      // Create a group for the force graph
      const forceGroup = d3Node.append('g')
        .attr('class', 'force-graph')
        .attr('transform', `translate(0, ${this.nodeHeight / 2 + 40})`);

      // Create links with proper class for SCSS styling
      const forceLinks = forceGroup.selectAll('.force-link')
        .data(forceGraph.links)
        .enter()
        .append('path')
        .attr('class', 'force-link');

      // Create nodes with force-node class for separate SCSS styling
      const forceNodes = forceGroup.selectAll('.force-node')
        .data(allNodes) // Use allNodes instead of forceGraph.nodes
        .enter()
        .append('g')
        .attr('class', (d: ForceNode) => {
          let classes = 'force-node';

          // Add special class for container node
          if (d.id === containerForceNode.id) {
            classes += ' container-node';
          }

          // Add type class matching SCSS structure
          if (d.group === 1) {
            classes += ' credit';
          } else if (d.group === 2) {
            classes += ' control';
          } else {
            classes += ' company';
          }

          // Add selected state if applicable
          if (d.selected) {
            classes += ' selected';
          }

          return classes;
        })
        .call(d3.drag<SVGGElement, ForceNode>()
          .on('start', (event, d) => {
            // Only allow dragging of non-container nodes
            if (d.id !== containerForceNode.id) {
              this.dragStarted(event, d, containerNode.forceGraphId!);
            }
          })
          .on('drag', (event, d) => {
            if (d.id !== containerForceNode.id) {
              this.dragging(event, d);
            }
          })
          .on('end', (event, d) => {
            if (d.id !== containerForceNode.id) {
              this.dragEnded(event, d, containerNode.forceGraphId!);
            }
          })
        );

      // Add rectangles to force nodes with proper styling
      forceNodes.append('rect')
        .attr('width', this.forceNodeWidth)
        .attr('height', this.forceNodeHeight)
        .attr('x', -this.forceNodeWidth / 2)
        .attr('y', -this.forceNodeHeight / 2)
        .attr('rx', 5)
        .attr('ry', 5);

      // Add name text with proper class for SCSS styling
      forceNodes.append('text')
        .attr('dy', '-0.5em')
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('class', 'node-name')
        .text((d: ForceNode) => d.name);

      // Add group text with proper class for SCSS styling
      forceNodes.append('text')
        .attr('dy', '1em')
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'node-group') // Fixed: removed duplicate class attribute
        .text((d: ForceNode) => `Group: ${d.group || ''}`);

      // Create force simulation with container node as static
      const simulation = this.mixTreeForceService.createForceSimulationSimple(
        allNodes, // Use all nodes
        forceGraph.links as ForceLink[],
        [containerForceNode.id] // Make container node static
      );

      // Store the simulation
      this.forceSimulations.set(containerNode.forceGraphId, simulation);

      // Update positions on tick
      simulation.on('tick', () => {
        forceLinks
          .attr('d', (d: any) => {
            const source = d.source;
            const target = d.target;

            // Simple straight line for force links
            return `M ${source.x},${source.y} L ${target.x},${target.y}`;

            // Alternative: Curved path (uncomment if preferred)
            // return `
            //   M ${source.x},${source.y}
            //   C ${(source.x + target.x) / 2},${source.y}
            //     ${(source.x + target.x) / 2},${target.y}
            //     ${target.x},${target.y}
            // `;
          });

        forceNodes
          .attr('transform', (d: ForceNode) => `translate(${d.x || 0},${d.y || 0})`);
      });
    });
  }


  /**
   * Center the graph - method implementation with correct typing
   */
  public centerGraph(): void {
    if (!this.treeRoot) return;

    // Get the bounds of the tree
    const nodes = this.treeRoot.descendants();
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, (node.x || 0) - this.nodeWidth / 2);
      maxX = Math.max(maxX, (node.x || 0) + this.nodeWidth / 2);
      minY = Math.min(minY, (node.y || 0) - this.nodeHeight / 2);
      maxY = Math.max(maxY, (node.y || 0) + this.nodeHeight / 2);

      // Check if this node has a force graph
      const nodeData = node.data as TreeNode;
      if (nodeData.forceGraphId) {
        const forceGraph = this.mixTreeForceService.getForceGraphById(nodeData.forceGraphId);
        if (forceGraph && forceGraph.nodes.length > 0) {
          // Adjust bounds to include force graph nodes
          const forceHeight = this.forceNodeHeight * forceGraph.nodes.length * 0.5;
          maxY = Math.max(maxY, (node.y || 0) + this.nodeHeight / 2 + 40 + forceHeight);
        }
      }
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate the dimensions
    const width = maxX - minX;
    const height = maxY - minY;

    // Calculate the scale
    const scale = Math.min(
      this.width / width,
      this.height / height,
      1
    );

    // Calculate the translation
    const tx = ((this.width - width * scale) / 2) - minX * scale;
    const ty = ((this.height - height * scale) / 2) - minY * scale;

    // Apply zoom transform - with proper typing
    this.svg.transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
  }

  /**
   * Reset the graph - added method referenced in the template
   */
  public resetGraph(): void {
    if (!this.hybridGraph) return;

    // Stop all force simulations
    this.forceSimulations.forEach(simulation => simulation.stop());

    // Re-render the graph
    this.renderGraph();

    // Center the view
    this.centerGraph();
  }

  /**
   * Handle node click
   */
  private handleNodeClick(event: any, d: d3.HierarchyNode<unknown>): void {
    const nodeData = d.data as TreeNode;
    console.log('Node clicked:', nodeData);

    // Set selected state
    nodeData.selected = !nodeData.selected;

    // Update node class
    d3.select(event.currentTarget)
      .classed('selected', nodeData.selected);

    // Stop event propagation
    event.stopPropagation();
  }

  /**
   * Handle force node drag start
   */
  private dragStarted(event: any, d: ForceNode, forceGraphId: string): void {
    const simulation = this.forceSimulations.get(forceGraphId);
    if (!simulation) return;

    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;

    // Stop event propagation
    event.sourceEvent.stopPropagation();
  }

  /**
   * Handle force node dragging
   */
  private dragging(event: any, d: ForceNode): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  /**
   * Handle force node drag end
   */
  private dragEnded(event: any, d: ForceNode, forceGraphId: string): void {
    const simulation = this.forceSimulations.get(forceGraphId);
    if (!simulation) return;

    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  /**
   * Gets all nodes of type '額度' from the tree
   * @returns Array of all nodes with type '額度'
   */
  public getCreditTypeNodes(): TreeNode[] {
    if (!this.hybridGraph || !this.hybridGraph.tree) {
      return [];
    }

    // Initialize the result array
    const creditNodes: TreeNode[] = [];

    // Use a Set to track visited nodes to avoid duplicates in case of multi-parent nodes
    const visitedNodeIds = new Set<string>();

    /**
     * Helper function to recursively traverse the tree
     * @param node Current node to check
     */
    const traverseTree = (node: TreeNode): void => {
      // Skip if we've already visited this node
      if (visitedNodeIds.has(node.id)) {
        return;
      }

      // Mark node as visited
      visitedNodeIds.add(node.id);

      // Check if this node is of type '額度'
      if (node.type === '額度') {
        creditNodes.push(node);
      }

      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverseTree);
      }

      // Also check collapsed children if they exist
      if (node._children && node._children.length > 0) {
        node._children.forEach(traverseTree);
      }
    };

    // Start traversal from the root
    traverseTree(this.hybridGraph.tree);

    return creditNodes;
  }

  /**
   * Gets all nodes of the specified type from the tree
   * @param nodeType The type of nodes to find
   * @returns Array of all nodes matching the specified type
   */
  public getNodesByType(nodeType: string): TreeNode[] {
    if (!this.hybridGraph || !this.hybridGraph.tree) {
      return [];
    }

    // Initialize the result array
    const result: TreeNode[] = [];

    // Use a Set to track visited nodes to avoid duplicates in case of multi-parent nodes
    const visitedNodeIds = new Set<string>();

    /**
     * Helper function to recursively traverse the tree
     * @param node Current node to check
     */
    const traverseTree = (node: TreeNode): void => {
      // Skip if we've already visited this node
      if (visitedNodeIds.has(node.id)) {
        return;
      }

      // Mark node as visited
      visitedNodeIds.add(node.id);

      // Check if this node matches the requested type
      if (node.type === nodeType) {
        result.push(node);
      }

      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverseTree);
      }

      // Also check collapsed children if they exist
      if (node._children && node._children.length > 0) {
        node._children.forEach(traverseTree);
      }
    };

    // Start traversal from the root
    traverseTree(this.hybridGraph.tree);

    return result;
  }

  /**
   * Gets nodes from both the tree and force graphs matching specified criteria
   * @param options Options for filtering nodes
   * @returns Object containing tree nodes and force nodes matching criteria
   */
  public getAllNodesBy(options: {
    treeNodeType?: string;
    forceNodeGroup?: number;
  }): {
    treeNodes: TreeNode[];
    forceNodes: ForceNode[];
  } {
    const result = {
      treeNodes: [] as TreeNode[],
      forceNodes: [] as ForceNode[]
    };

    if (!this.hybridGraph) {
      return result;
    }

    // Get matching tree nodes
    if (options.treeNodeType) {
      result.treeNodes = this.getNodesByType(options.treeNodeType);
    }

    // Get matching force nodes
    if (options.forceNodeGroup !== undefined && this.hybridGraph.forceGraphs) {
      // Collect nodes from all force graphs
      Object.values(this.hybridGraph.forceGraphs).forEach(forceGraph => {
        const matchingNodes = forceGraph.nodes.filter(node =>
          node.group === options.forceNodeGroup
        );

        result.forceNodes.push(...matchingNodes);
      });
    }

    return result;
  }
}

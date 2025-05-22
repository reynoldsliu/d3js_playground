// src/app/services/hybrid-graph.service.ts
import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import * as d3 from 'd3';
import {
  TreeNode,
  ForceNode,
  ForceLink,
  ForceGraph,
  HybridGraph, MixNode
} from '../models/mix-interface';

@Injectable({providedIn: 'root'})
export class MixTreeForceService {

  private _hybridGraph = new BehaviorSubject<HybridGraph | null>(null);

  // Observable streams
  public readonly hybridGraph$ = this._hybridGraph.asObservable();

  constructor() {
  }

  /**
   * Loads a hybrid graph structure
   */
  public loadHybridGraph(graph: HybridGraph): void {
    this._hybridGraph.next(graph);
  }

  /**
   * Finds leaf nodes in the tree that contain force graphs
   */
  public findForceContainerNodes(treeRoot: MixNode): MixNode[] {
    const containerNodes: MixNode[] = [];

    // Helper for recursive traversal
    const traverse = (node: MixNode) => {
      // Check if this node contains a force graph
      if (node.forceGraphId) {
        containerNodes.push(node);
      }

      // Process children
      if (node.children) {
        node.children.forEach(traverse);
      }

      // Process collapsed children
      if (node._children) {
        node._children.forEach(traverse);
      }
    };

    // Start traversal
    traverse(treeRoot);

    return containerNodes;
  }

  /**
   * Retrieves a force graph by ID
   */
  public getForceGraphById(graphId: string): ForceGraph | undefined {
    const hybridGraph = this._hybridGraph.value;
    return hybridGraph?.forceGraphs[graphId];
  }

  /**
   * Creates a D3 tree layout for vertical orientation
   */
  public createTreeLayout(width: number, height: number, nodeSize: [number, number]): d3.TreeLayout<unknown> {
    return d3.tree()
      .nodeSize(nodeSize)
      .separation((a, b) => {
        const aNode = a.data as TreeNode;
        const bNode = b.data as TreeNode;

        // Increase separation if one of the nodes contains a force graph
        return (aNode.forceGraphId || bNode.forceGraphId) ? 2.5 : 1.5;
      });
  }

  createForceSimulation(nodes: ForceNode[], links: ForceLink[], treeNode: d3.HierarchyNode<unknown>) {
    // Mark static nodes by setting their fx/fy AND adding a static flag
    nodes.forEach(node => {
      if (node.isTreeNode) {
        // Fix position so forces don't move them

        node.fx = treeNode.x || 0;
        node.fy = treeNode.y || 0;
      } else {
        // Ensure non-static nodes can move
        node.fx = null;
        node.fy = null;
      }
    });
    console.log('create')
    return d3.forceSimulation(nodes)
      .force('link', d3.forceLink<ForceNode, ForceLink>(links)
        .id((d: any) => {
          console.log(d)
          if(d.isTreeNode)return null;
          return d.id;
        })
        .distance(50))
      .force('charge', d3.forceManyBody()
        .strength((d: any) => {
          // Static nodes don't repel/attract other nodes
          return d.isTreeNode ? 0 : -100;
        }))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide()
        .radius((d: any) => d.radius || 10)
    // @ts-ignore
        .strength((d: any): number => {
          // Static nodes don't participate in collision
          console.log(d.isTreeNode)
          return d.isTreeNode ? 0 : 1;
        }));
  }

  /**
   * Generates a sample hybrid graph structure
   */
  public generateSampleHybridGraph(): HybridGraph {
    // Create a tree structure
    const tree: MixNode = {
      id: 'root',
      name: '根節點',
      level: 0,
      children: [
        {
          id: 'branch1',
          name: '分支1',
          level: 1,
          type: '合控',
          parentId: ['root'],
          children: [
            {
              id: 'leaf1',
              name: '葉子1',
              level: 2,
              type: '額度',
              parentId: ['branch1'],
              // This leaf contains a force graph
              forceGraphId: 'force1',
              group: 1,
              value: 1,
              x: 0,
              y: 0,
              fx: 0,
              fy: 0,
            }
          ]
        },
        {
          id: 'branch2',
          name: '分支2',
          level: 1,
          type: '合控',
          parentId: ['root'],
          children: [
            {
              id: 'leaf2',
              name: '葉子2',
              level: 2,
              type: '額度',
              parentId: ['branch2'],
              group: 1,
              value: 1,
              x: 0,
              y: 0,
              fx: 0,
              fy: 0,
            },
            {
              id: 'leaf3',
              name: '葉子3',
              level: 2,
              type: '額度',
              parentId: ['branch2'],
              // This leaf contains a force graph
              forceGraphId: 'force2',
              group: 1,
              value: 1,
              x: 0,
              y: 0,
              fx: 0,
              fy: 0,
            }
          ]
        }
      ]
    };

    // Create force graphs
    const forceGraphs: { [key: string]: ForceGraph } = {
      'force1': {
        id: 'force1',
        name: '力導向圖1',
        containerNodeId: 'leaf1',
        nodes: [
          {id: 'fn1', name: '節點1', group: 1},
          {id: 'fn2', name: '節點2', group: 1},
          {id: 'fn3', name: '節點3', group: 2},
          {id: 'fn4', name: '節點4', group: 2}
        ],
        links: [
          {source: 'leaf1', target: 'fn2', value: 1},
          {source: 'leaf1', target: 'fn3', value: 1},
          {source: 'leaf1', target: 'fn4', value: 1},
          {source: 'leaf1', target: 'fn1', value: 1}
        ]
      },
      'force2': {
        id: 'force2',
        name: '力導向圖2',
        containerNodeId: 'leaf3',
        nodes: [
          {id: 'fn5', name: '節點5', group: 1},
          {id: 'fn6', name: '節點6', group: 1},
          {id: 'fn7', name: '節點7', group: 3}
        ],
        links: [
          {source: 'leaf3', target: 'fn6', value: 1},
          {source: 'leaf3', target: 'fn7', value: 1},
          {source: 'leaf3', target: 'fn5', value: 1}
        ]
      }
    };

    // Create and return the hybrid graph
    return {
      id: 'sample',
      name: '混合圖範例',
      tree: tree,
      forceGraphs: forceGraphs
    };
  }

  /**
   * Converts a TreeNode to a ForceNode
   * This ensures all required ForceNode properties are set
   */
  convertTreeNodeToForceNode(treeNode: TreeNode): ForceNode {
    // If it's already a MixNode, use its ForceNode properties
    if ('x' in treeNode && 'y' in treeNode) {
      const forceNode = treeNode as ForceNode;
      forceNode.isTreeNode = true;
      return forceNode;
    }

    // Otherwise, create a new ForceNode with values from TreeNode
    return {
      id: treeNode.id,
      name: treeNode.name,
      type: treeNode.type,
      selected: treeNode.selected,
      description: treeNode.description,
      // Set default ForceNode properties
      group: 0, // Default group
      value: 1, // Default value
      // Initial positions might be set by the force simulation
      x: 0,
      y: 0,
      fx: null,
      fy: null,
      radius: 10, // Default radius
      color: '#ccc', // Default color,
      isTreeNode: true
    };
  }

  // Make sure your createForceSimulationSimple method looks like this:
  createForceSimulationSimple(nodes: ForceNode[], links: ForceLink[], staticNodeIds: string[] = []) {
    // Fix static nodes at their current positions
    nodes.forEach(node => {
      if (staticNodeIds.includes(node.id)) {
        node.fx = node.x || 0;
        node.fy = node.y || 0;
      }
    });

    // Create simulation with all nodes (including static ones)
    return d3.forceSimulation(nodes)
      .force('link', d3.forceLink<ForceNode, ForceLink>(links)
        .id((d: any) => d.id)
        .distance(400))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius || 10));
  }

}


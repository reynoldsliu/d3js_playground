// src/app/models/graph-interfaces.ts

/**
 * Base node interface with common properties
 */
export interface BaseNode {
  id: string;
  name: string;
  type?: string;
  selected?: boolean;
  description?: string;
}

/**
 * Tree node structure - hierarchical parent-child relationships
 */
export interface TreeNode extends BaseNode {
  parentId?: string[];
  level?: number;
  type?: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // For collapsed nodes
  collapsed?: boolean;

  // Optional reference to a force graph if this is a container leaf
  forceGraphId?: string;
}

/**
 * Force node structure - for force-directed graph
 */
export interface ForceNode extends BaseNode {
  group?: number;
  value?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;

  // For visual properties
  radius?: number;
  color?: string;
  isTreeNode?: boolean;
}

export interface MixNode extends TreeNode, ForceNode {
  parentId?: string[];
  level?: number;
  type?: string;
  children?: MixNode[];
  _children?: MixNode[]; // For collapsed nodes
  collapsed?: boolean;

  // Optional reference to a force graph if this is a container leaf
  forceGraphId?: string;

  group?: number;
  value?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;

  // For visual properties
  radius?: number;
  color?: string;
}

/**
 * Force link structure - connects nodes in force-directed graph
 */
export interface ForceLink {
  source: string | ForceNode;
  target: string | ForceNode;
  value?: number;
  type?: string;
}

/**
 * Force graph structure - contains nodes and links
 */
export interface ForceGraph {
  id: string;
  name: string;
  nodes: ForceNode[];
  links: ForceLink[];

  // Container node that holds this force graph (if part of a hybrid structure)
  containerNodeId?: string;
}

/**
 * Hybrid graph structure - combines tree and force graphs
 */
export interface HybridGraph {
  id: string;
  name: string;
  tree: TreeNode;
  forceGraphs: {[key: string]: ForceGraph};
}

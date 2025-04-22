import {ElementRef, Injectable} from '@angular/core';
import * as d3 from 'd3';
import {TreeNode, TreeState} from '../interfaces/interfaces';
import {Selection} from 'd3-selection';
import {HierarchyNode} from 'd3-hierarchy';

@Injectable()
export class TreeVisualizationService {

  public initNodes: any;
  public svg: Selection<any, any, any, any> | undefined;
  public root: HierarchyNode<any> | undefined;
  public treeState: TreeState = {selectedNodes: [], highlightNodes: []};

  constructor() {
  }

  getInitNode(data: TreeNode) {
    if (this.initNodes) {
      return this.initNodes;
    }

    const width = 928;
    const height = 500;

    // Compute the tree height; this approach will allow the height of the
    // this.svg to scale according to the breadth (width) of the tree layout.
    this.root = d3.hierarchy(data);
    console.log(data);
    console.log(this.root);
    const dx = 200;
    const dy = height / (this.root.height + 1);

    // Create a tree layout.
    const tree = d3.tree<TreeNode>().nodeSize([dx, dy]);

    // Sort the tree and apply the layout.
    this.root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
    tree(this.root);

    // Compute the extent of the tree.
    let x0 = Infinity;
    let x1 = -x0;
    let y0 = Infinity;
    let y1 = -y0;
    this.root.each(d => {
      if (d.x !== undefined && d.x > x1) {
        x1 = d.x;
      }
      if (d.x !== undefined && d.x < x0) {
        x0 = d.x;
      }
      if (d.y !== undefined && d.y > y1) {
        y1 = d.y;
      }
      if (d.y !== undefined && d.y < y0) {
        y0 = d.y;
      }
    });

    this.svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [x0 - dx, y0 - dy, x1 - x0 + dx * 2, y1 - y0 + dy * 2])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Create the links
    const links = this.root.links();
    const linkGenerator = d3.linkVertical()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    const link = this.svg.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', (d: any) => linkGenerator(d));

    const node = this.svg.append('g')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .selectAll('.node')
      .data(this.root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
      .on('click', (event, d: TreeNode) => {
        console.log('click');
        console.log(d);
        this.treeState.selectedNodes.push(d);
        console.log(this.treeState.selectedNodes);
      })
      .on('blur', (event, d: TreeNode) => {
        console.log('blur');
        this.treeState.selectedNodes = [];
          // this.treeState.selectedNodes.filter(node => node.id != d.id);
        console.log(this.treeState.selectedNodes);
      });

    node.append('circle')
      .attr('fill', d => d.children ? '#555' : '#999')
      .attr('r', 2.5);

    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -6 : 6)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('stroke', 'white')
      .attr('paint-order', 'stroke');

    node.append('foreignObject')
      .attr('width', 120)
      .attr('height', 80)
      .attr('x', -60)
      .attr('y', -40)
      .html(d => {
        // Create custom HTML for each node
        return `
      <div class="node-container" style="width: 100%; height: 100%;">
        <div class="node-title">${d.data.name}</div>
        <div class="node-content">${d.data.data || ''}</div>
        <button class="node-button" data-id="${d.data.id}">Details</button>
      </div>
    `;
      });

    return this.svg.node();
  }

  findNode(id: string): TreeNode | undefined {
    const targetNode = this.root?.descendants().find(node => node.data.name === id);
    console.log(targetNode);
    if (targetNode) {
      return targetNode;
    }
    return undefined;
  }

  getSelectedNodes(): TreeNode[] {
    return this.treeState.selectedNodes;
  }

  removeSelectedNodes(nodeIds: (string | undefined)[]): void {
    nodeIds.forEach((id: string | undefined) => {
      if (id) {
        const parent = this.root?.find(node => node.id === id)?.parent;
        const children = parent?.descendants();
        if (parent && children) {
          parent.children = children?.filter(d => nodeIds.includes(d.id));
        }
      }
    });
  }

  getRoot(){
    return this.root as HierarchyNode<TreeNode>;
  }

}

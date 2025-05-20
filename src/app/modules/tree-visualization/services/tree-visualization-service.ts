import {Injectable, OnDestroy} from '@angular/core';
import * as d3 from 'd3';
import {TreeNode} from '../interfaces/interfaces';
import {HierarchyNode} from 'd3-hierarchy';
import {TreeDataService} from './tree-data-service';
import {TreeLayout} from 'd3';
import {TreeDragDropService} from './tree-drag-drop-service';
import {TreeZoomService} from './tree-zoom-service';
import {TreeTooltipService} from './tree-tooltip-service';
import {StyleUpdateEvent, TreeStyleService} from './tree-style-service';
import {Subject, takeUntil} from 'rxjs';

@Injectable()
export class TreeVisualizationService implements OnDestroy {

  public svg: any;
  public nodes: any;
  public links: any;
  public rects: any;
  public g: any;

  public svgWidth = 1200;
  public svgHeight = 800;
  public nodeWidth = 220;
  public nodeHeight = 120;
  private styles: any;

  // For cleanup
  private destroy$ = new Subject<void>();

  constructor(private treeDataService: TreeDataService,
              private treeDragDropService: TreeDragDropService,
              private treeZoomService: TreeZoomService,
              private treeStyleService: TreeStyleService,
              private treeTooltipService: TreeTooltipService,) {
    // Get initial styles
    this.styles = this.treeStyleService.styles;

    // Subscribe to style changes
    this.treeStyleService.styles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.styles = styles;
        // Instead of reinitializing the entire tree, just update styles
        this.updateAllStyles();
      });

    // Subscribe to style update events for targeted updates
    this.treeStyleService.styleUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleStyleUpdateEvent(event);
      });
  }

  /**
   * 計算樹的高度（最長路徑的節點數）
   * @param data 樹的數據結構
   * @returns 樹的高度（從根節點到最深葉節點的路徑長度）
   */
  public getTreeHeight(data: TreeNode | null): number {
    if (!data) {
      if (this.loadTreeData()) {
        data = this.loadTreeData();
      } else {
        return 0;
      }
    }

    // 創建一個臨時的層次結構以計算深度
    // 確保層次結構使用children進行正確的遍歷
    const root = d3.hierarchy(data, node => node.children);

    // 獲取樹的高度 (root.height 是最長路徑上的邊數，+1 得到節點數)
    const treeHeight = root.height + 1;

    // 返回實際的樹高度
    return treeHeight;
  }

  /**
   * 獲取當前樹的高度（使用TreeDataService中的最新數據）
   * @returns 當前樹的高度
   */
  public getCurrentTreeHeight(): number {
    const currentData = this.treeDataService.getTreeData();
    return this.getTreeHeight(currentData);
  }

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
              { // TODO duplicate
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
              },{ // TODO duplicate
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
              hasMultipleParents: true,
              children: []
            }],
          }],
        }
      ]
    } as TreeNode;
  }

  public initializeTree(data: TreeNode | undefined) {
    if (data) {
      this.treeDataService.loadInitialData(data);
    }

    const root = d3.hierarchy(data) as HierarchyNode<unknown>;
    // const tree = d3.tree().nodeSize([this.nodeWidth * 1.5, this.nodeHeight * 3]);
    let tree;
    if (data) {
      tree = this.calculateOptimalNodeSpacing(data);
      tree(root);
    }

    // Hide children initially if collapsed property is true
    root.descendants().forEach((d: any) => {
      if (d.data.collapsed && d.children) {
        d._children = d.children;
        d.children = null;
      }
    });

    // 初始化tooltip
    const tooltip =
      this.treeTooltipService.initializeTooltip(this.styles.tooltip,
        this.svgWidth,
        this.svgHeight,
        this.nodeWidth,
        this.nodeHeight,
      );

    // Create SVG
    this.svg = d3.select('.tree-visualization')
      .append('svg')
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight)
      .attr('viewBox', [0, 0, this.svgWidth, this.svgHeight])
      .attr('style', 'max-width: 100%; height: auto;')
      .on('click', () => {
        this.treeDataService.selectNode(null);
      });

    // Create a group with margin
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.nodeHeight * 2}, ${this.svgHeight / 2})`)
      // .attr('transform', `translate(${this.svgWidth / 2}, ${this.nodeHeight * 2})`);

    // Create nodes
    this.nodes = this.g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return `node ${nodeData.selected ? 'selected' : ''} ${nodeData.locked ? 'locked' : ''}`;
      })
      .attr('id', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return `node-${nodeData.id}`;
      })
      .attr('transform', (d: { x: any; y: any; }) => `translate(${d.y},${d.x})`)
      // .attr('transform', (d: { x: any; y: any; }) => `translate(${d.x},${d.y})`)
      .style('cursor', 'grab')
      .style('pointer-events', 'all')  // 確保元素能夠接收鼠標事件
      .on('click', (event: any, d: d3.HierarchyNode<unknown>) => this.handleNodeClick(event, d))
      .attr('draggable', true)
      .attr('cursor', 'move')  // 改變滑鼠游標為移動指示器
    // .call(d3.drag()
    //   .on('start', (event, d) => this.treeDragDropService.dragStarted(event, d))
    //   .on('drag', (event, d) => this.treeDragDropService.dragging(event, d))
    //   .on('end', (event, d) => this.treeDragDropService.dragEnded(event, d))
    // ) // TODO disable drag-drop
    ;

    const nodeMap = {};
    for(const node of this.nodes.data()) {
      // @ts-ignore
      nodeMap[node.data.id] = node;
    }
    console.log(nodeMap);

    // Create links
    this.links = this.g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {

        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        const midY = (sourceY + targetY) / 2;

        // @ts-ignore
        const sourceNode = nodeMap[d.source.data.id as string];
        // @ts-ignore
        const targetNode = nodeMap[d.target.data.id as string];
        console.log(sourceNode, targetNode);
        return `
  M ${sourceNode.y},${sourceNode.x}
  C ${(sourceNode.y + targetNode.y) / 2},${sourceNode.x}
    ${(sourceNode.y + targetNode.y) / 2},${targetNode.x}
    ${targetNode.y},${targetNode.x}
`;
        // // If it's a multi-parent link, add a curve
        // if (d.type === "parent1" || d.type === "parent2") {
        //   // Create curved path with different offsets
        //   const offset = d.type === "parent1" ? -30 : 30;
        //   return `
        //             M ${sourceNode.x},${sourceNode.y}
        //             C ${sourceNode.x},${(sourceNode.y + targetNode.y) / 2 + offset}
        //               ${targetNode.x},${(sourceNode.y + targetNode.y) / 2 + offset}
        //               ${targetNode.x},${targetNode.y}
        //         `;
        // } else {
        //   // Simple straight line with slight curve
        //   return `
        //             M ${sourceNode.x},${sourceNode.y}
        //             C ${sourceNode.x},${(sourceNode.y + targetNode.y) / 2}
        //               ${targetNode.x},${(sourceNode.y + targetNode.y) / 2}
        //               ${targetNode.x},${targetNode.y}
        //         `;
        // }
      })
      .style('fill', 'none')
      .style('stroke', this.styles.link.stroke)
      .style('stroke-width', this.styles.link.strokeWidth)
      .style('opacity', this.styles.link.opacity);

    // // Create links
    // this.links = this.g.selectAll('.link')
    //   .data(root.links())
    //   .enter()
    //   .append('path')
    //   .attr('class', 'link')
    //   .attr('d', (d: any) => {
    //     const sourceX = d.source.x;
    //     const sourceY = d.source.y;
    //     const targetX = d.target.x;
    //     const targetY = d.target.y;
    //     const midY = (sourceY + targetY) / 2;
    //
    //     return `M${sourceX},${sourceY}
    //             L${sourceX},${midY}
    //             L${targetX},${midY}
    //             L${targetX},${targetY}`;
    //   })
    //   .style('fill', 'none')
    //   .style('stroke', this.styles.link.stroke)
    //   .style('stroke-width', this.styles.link.strokeWidth)
    //   .style('opacity', this.styles.link.opacity);

    // Add rectangles
    this.nodes.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)
      .attr('y', -this.nodeHeight / 2)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) {
          return this.styles.node.company.fill;
        }
        if (nodeData.type === '額度') {
          return this.styles.node.credit.fill;
        }
        if (nodeData.type === '合控') {
          return this.styles.node.control.fill;
        }
        return this.styles.node.default.fill;
      })
      .style('stroke', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.selected) {
          return this.styles.node.selected.stroke;
        }
        if (nodeData.level === 0) {
          return this.styles.node.company.stroke;
        }
        if (nodeData.type === '額度') {
          return this.styles.node.credit.stroke;
        }
        if (nodeData.type === '合控') {
          return this.styles.node.control.stroke;
        }
        return this.styles.node.default.stroke;
      })
      .style('stroke-width', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.selected) {
          return this.styles.node.selected.strokeWidth;
        }
        if (nodeData.level === 0) {
          return this.styles.node.company.strokeWidth;
        }
        if (nodeData.type === '額度') {
          return this.styles.node.credit.strokeWidth;
        }
        if (nodeData.type === '合控') {
          return this.styles.node.control.strokeWidth;
        }
        return this.styles.node.default.strokeWidth;
      });

    // Replace the existing fold/unfold control code with this:

// In your fold/unfold control creation code
    this.nodes.append('g')
      .attr('class', 'fold-control')
      // .attr('transform', (d: any) => `translate(${this.nodeWidth / 2 + 15}, 0)`)
      .attr('transform', (d: any) => `translate(0, ${this.nodeHeight / 2 + 15})`)
      .style('display', (d: any) => d.children || d._children ? 'block' : 'none')
      .style('pointer-events', 'all') // Keep it interactive
      .style('visibility', 'visible')
      .attr('data-spacing-ignore', 'true') // Add a custom attribute for identification
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        this.toggleFoldOfNode(d);
      })
      .append('circle')
      .attr('r', 8)
      .style('fill', '#f8f8f8')
      .style('stroke', '#ccc')
      .style('stroke-width', '1px');

// Add + or - symbol to fold/unfold control
    this.nodes.select('.fold-control')
      .append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text((d: any) => d.children ? '−' : '+');

    // Add circles for nodes
    this.nodes.append('circle')
      .attr('class', 'node-circle')
      .attr('r', 1e-6)
      .style('fill', (d: any) => d._children ? 'lightsteelblue' : '#fff')
      .style('stroke', 'steelblue')
      .style('stroke-width', '1.5px');

    // Add labels for nodes
    this.nodes.append('text')
      .attr('class', 'node-label')
      .attr('dy', '.15em')
      .attr('x', 100)
      .text((d: any) => d.data.name)
      .attr('opacity', 0);

    // Add name text
    this.nodes.append('text')
      .attr('dy', '-1.5em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-name')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.level === 0) {
          return '提案名稱: ' + (d.data as TreeNode).name;
        }
        return '額度編號: ' + (d.data as TreeNode).name;
      })
      .style('fill', this.styles.text.title.color)
      .style('font-size', this.styles.text.title.size)
      .style('font-weight', 'bold');

    // Add type text
    this.nodes.append('text')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-type')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.type) {
          return '額度種類: ' + ((d.data as TreeNode).type || '');
        }
        return '';
      })
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // Add currency text
    this.nodes.append('text')
      .attr('dy', '2.2em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-currency')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.level !== 0) {
          if (!((d.data as TreeNode).currency)) {
            d.data.currency = '新台幣';
          }
          return '幣別: ' + ((d.data as TreeNode).currency || '');
        }
        return '';
      })
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // Add percentages text
    this.nodes.append('text')
      .attr('dy', '3.4em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-percentages')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.type && node.amount) {
          return `金額: ${node.amount.toLocaleString()}元`;
        }
        return '';
      })
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // Add state text
    this.nodes.append('text')
      .attr('dy', '4.6em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-currency')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.state) {
          return '帳務狀態: ' + ((d.data as TreeNode).state || '');
        }
        return '';
      })
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // 在节点组中添加提示图标
    const noteIcons = this.treeTooltipService.genTooltip(this.nodes);

    // TODO 整合 全文件聆聽事件
    // part in TreeTooltipService
    // d3.select('body').on('click', () => {
    //   if (this.tooltip) {
    //     this.tooltip.style('visibility', 'hidden');
    //     this.setActiveTooltip(false);
    //   }
    // });
    return this.svg.node();
  }

  // Add this method to your TreeVisualizationService class
  private calculateOptimalNodeSpacing(data: TreeNode): TreeLayout<unknown> {
    // First, temporarily hide fold controls for spacing calculations

    // Get hierarchical representation of the tree
    const root = d3.hierarchy(data);

    // Find the maximum number of nodes at any level
    const nodesByLevel: { [level: number]: number } = {};

    // Count nodes at each level
    root.each(node => {
      const level = node.depth;
      nodesByLevel[level] = (nodesByLevel[level] || 0) + 1;
    });

    // Find the level with the most nodes
    const maxNodesInLevel = Math.max(...Object.values(nodesByLevel));

    // Calculate the optimal spacing based on the most populated level
    // Use the available width divided by the maximum number of nodes
    const availableWidth = this.svgWidth * 0.8; // Use 80% of SVG width to leave margins
    const minNodeSpacing = this.nodeWidth * 1.2; // Minimum space between nodes

    // Calculate base node spacing
    let horizontalSpacing = Math.max(
      availableWidth / Math.max(maxNodesInLevel - 1, 1),
      minNodeSpacing
    );

    const availableHeight = this.svgHeight * 0.8; // Use 80% of SVG width to leave margins
    const minNodeSpacing2 = this.nodeHeight * 1.2; // Minimum space between nodes

    let verticalSpacing = Math.max(
      availableHeight / Math.max(maxNodesInLevel - 1, 1),
      minNodeSpacing2
    );

    // Apply the calculated spacing to the tree layout
    const treeLayout = d3.tree<unknown>()
      .nodeSize([verticalSpacing, this.nodeWidth * 2.5])
      // .nodeSize([horizontalSpacing, this.nodeHeight * 2.5])
      .separation((a, b) => {
        // Adjust separation based on whether nodes have the same parent
        return a.parent === b.parent ? 1 : 1;
        // return a.parent === b.parent ? 1 : 1.2; TODO
      });

    // Return the configured tree layout
    return treeLayout;
  }


  private toggleFoldOfNode(d: any) {
    if (d.children) {
      // Collapse
      d._children = d.children;
      d.children = null;
      d.data.collapsed = true;
    } else {
      // Expand
      d.children = d._children;
      d._children = null;
      d.data.collapsed = false;
    }

    // Update the tree
    const currentData = this.treeDataService.treeDataSubject.getValue();
    if (currentData) {
      const newData = this.treeDataService.deepCloneTree(currentData);
      this.treeDataService.treeDataSubject.next(newData);
    }
  }

  private handleNodeClick(event: any, d: d3.HierarchyNode<unknown>) {
    event.stopPropagation();
    const nodeData = d.data as TreeNode;
    const nodeId = nodeData.id;

    if (nodeId) {
      // 取得目前變化狀態
      const currentTransform = d3.zoomTransform(this.svg.node());

      // 更新節點選擇
      this.treeDataService.selectNode(nodeId);
      this.treeStyleService.updateNodeStyles(this.nodes, nodeId, nodeData.name);

      // 恢復之前的變化狀態，防止移動
      this.svg.call(this.treeZoomService.zoom.transform, currentTransform);
    }
  }

  updateView(data: TreeNode): void {
    // 保存目前的變化狀態
    const currentTransform = this.svg && this.svg.node() ?
      d3.zoomTransform(this.svg.node()) :
      d3.zoomIdentity.translate(this.svgWidth / 2, this.nodeHeight * 2).scale(1);

    // 清除目前視圖
    if (this.svg) {
      this.svg.selectAll('*').remove();
    }

    // 重新初始化樹
    this.initializeTree(data);

    // 重設縮放
    this.treeZoomService.setupZoom(this.svg, this.g);

    // 恢復變化狀態
    this.svg.call(this.treeZoomService.zoom.transform, currentTransform);

    // 若有選中節點，恢復其選中狀態
    const selectedNodeId = this.treeDataService.getSelectedNodeId();
    if (selectedNodeId) {
      const selectedNode = this.treeDataService.getSelectedNode();
      if (selectedNode) {
        this.treeStyleService.updateNodeStyles(this.nodes, selectedNodeId, selectedNode.name);
      }
    }
  }

  public updateTree(data: TreeNode): void {
    const root = d3.hierarchy(data) as d3.HierarchyNode<TreeNode>;
    const tree = d3.tree<TreeNode>().nodeSize([this.nodeWidth * 1.5, this.nodeHeight * 3]);
    tree(root);

    // 計算樹的邊界，包含節點實際大小
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    root.each((d: any) => {
      // 微調節點的實際大小
      minX = Math.min(minX, d.x - this.nodeWidth / 2);
      maxX = Math.max(maxX, d.x + this.nodeWidth / 2);
      minY = Math.min(minY, d.y - this.nodeHeight / 2);
      maxY = Math.max(maxY, d.y + this.nodeHeight / 2);
    });

    // 增加邊框間距
    const padding = 50;
    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;

    // 設定縮放比例，確保所有節點可視
    const scale = Math.min(
      (this.svgWidth - padding * 2) / treeWidth,
      (this.svgHeight - padding * 2) / treeHeight,
      1.5 // 限制最大縮放比例為1.5
    );

    // 計算置中對齊位置
    const translateX = (this.svgWidth - treeWidth * scale) / 2 - minX * scale;
    const translateY = (this.svgHeight - treeHeight * scale) / 2 - minY * scale;

    // 建立新的變換
    const newTransform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    // Update links
    const linkUpdate = this.g.selectAll('.link')
      .data(root.links(), (d: d3.HierarchyLink<TreeNode>) => (d.target as d3.HierarchyNode<TreeNode>).data.id);

    const linkEnter = linkUpdate.enter()
      .append('path')
      .attr('class', 'link')
      .style('fill', 'none')
      .style('stroke', this.styles.link.stroke)
      .style('stroke-width', this.styles.link.strokeWidth)
      .style('opacity', 0);

    // 更新連接線，使用平滑過渡
    linkUpdate.merge(linkEnter)
      .transition()
      .duration(750)
      .attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        const midY = (sourceY + targetY) / 2;

        return `M${sourceX},${sourceY}
                L${sourceX},${midY}
                L${targetX},${midY}
                L${targetX},${targetY}`;
      })
      .style('opacity', 1);

    linkUpdate.exit()
      .transition()
      .duration(750)
      .style('opacity', 0)
      .remove();

    // Update nodes
    const nodeUpdate = this.g.selectAll('.node')
      .data(root.descendants(), (d: any) => d.data.id);

    const nodeEnter = nodeUpdate.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    // Add new node elements
    this.addNodeElements(nodeEnter);

    // Update existing nodes with transition
    nodeUpdate.merge(nodeEnter)
      .transition()
      .duration(750)
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    // Remove old nodes
    nodeUpdate.exit()
      .transition()
      .duration(750)
      .style('opacity', 0)
      .remove();

    // 更新提示图标
    this.nodes = this.g.selectAll('.node');

    const noteIcons = this.treeTooltipService.updateTooltip(this.nodes);

    // 套用新變換，動畫過渡
    this.svg.transition()
      .duration(750)
      .call(this.treeZoomService.zoom.transform, newTransform);
  }

  private addNodeElements(selection: any) {
    // Add rectangle
    selection.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)
      .attr('y', -this.nodeHeight / 2)
      .style('fill', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) {
          return '#e8f5e9';
        } // 根節點用綠色
        return nodeData.type === '額度' ? '#f3e5f5' : '#e3f2fd'; // 額度用紫色，合控用藍色
      })
      .style('stroke', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) {
          return '#81c784';
        } // 根節點用深綠色
        return nodeData.type === '額度' ? '#ba68c8' : '#64b5f6'; // 額度用深紫色，合控用深藍色
      })
      .attr('rx', 5)
      .attr('ry', 5);

    // Add content based on node level
    selection.each(function(this: SVGGElement, d: { data: TreeNode; }) {
      const nodeData = d.data as TreeNode;
      const nodeGroup = d3.select(this);
      const isCredit = nodeData.type === '額度';
      const textColor = nodeData.level === 0 ? '#2e7d32' : (isCredit ? '#ba68c8' : '#64b5f6');

      if (nodeData.level === 0) {
        // Root node - show company info
        nodeGroup.append('text')
          .attr('dy', '-0.5em')
          .attr('text-anchor', 'middle')
          .text(nodeData.name)
          .style('fill', textColor)
          .style('font-size', '14px')
          .style('font-weight', 'bold');

      } else {
        // Child nodes - show ID, type and amount
        nodeGroup.append('text')
          .attr('dy', '-0.5em')
          .attr('text-anchor', 'middle')
          .text(`ID: ${nodeData.id}`)
          .style('fill', textColor)
          .style('font-size', '12px')
          .style('font-weight', 'bold');

        nodeGroup.append('text')
          .attr('dy', '1em')
          .attr('text-anchor', 'middle')
          .text(`${nodeData.type}`)
          .style('fill', textColor)
          .style('font-size', '12px');

        nodeGroup.append('text')
          .attr('dy', '2em')
          .attr('text-anchor', 'middle')
          .text(`${nodeData.amount ? nodeData.amount.toLocaleString() : 0}元`)
          .style('fill', textColor)
          .style('font-size', '12px');
      }

      // Add lock status for all nodes
      if (nodeData.locked) {
        nodeGroup.append('text')
          .attr('dy', nodeData.level === 0 ? '2em' : '3em')
          .attr('text-anchor', 'middle')
          .text('🔒')
          .style('font-size', '10px');
      }
    });
  }

  private updateAllStyles() {
    if (!this.svg) {
      return;
    }

    // Update link styles
    if (this.links) {
      this.links = this.treeStyleService.updateLinkStyle(this.links);
    }

    // Update node styles
    if (this.nodes) {
      // Update rectangle styles
      this.treeStyleService.updateNodeRect(this.nodes.selectAll('rect'));

      // Update text styles
      this.treeStyleService.updateTitleStyle(this.nodes.selectAll('.node-name'));
      this.treeStyleService.updateInfoStyle(this.nodes.selectAll('.node-type, .node-currency, .node-percentages'));
    }
  }

  /**
   * Handle style update events for efficient updates
   */
  private handleStyleUpdateEvent(event: StyleUpdateEvent): void {
    if (!this.svg || !this.nodes) {
      return;
    }
    this.treeStyleService.handleStyleUpdateEvent(event, this.nodes);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

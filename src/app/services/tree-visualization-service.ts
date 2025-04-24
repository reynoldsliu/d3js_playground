import {ElementRef, Injectable} from '@angular/core';
import * as d3 from 'd3';
import {TreeNode} from '../interfaces/interfaces';
import {Selection} from 'd3-selection';
import {HierarchyNode} from 'd3-hierarchy';
import {BehaviorSubject} from 'rxjs';
import {TreeDataService} from './tree-data-service';

@Injectable()
export class TreeVisualizationService {

  public svg: any;
  public nodes: any;
  public links: any;
  public rects: any;
  public g: any;

  private zoom: any;

  public svgWidth = 928;
  public svgHeight = 500;
  public nodeWidth = 75;
  public nodeHeight = 40;

  constructor(private treeDataService: TreeDataService,) {
  }

  public loadTreeData(): TreeNode {
    return {
      id: '1',
      name: 'Eve',
      level: 0,
      locked: false,
      selected: false,
      reports: ['創世紀報告', '人類起源研究'],
      children: [
        {
          id: '2',
          name: 'Cain',
          parentId: '1',
          level: 1,
          locked: true,
          selected: false,
          reports: ['農業發展計畫']
        },
        {
          id: '3',
          name: 'Seth',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: ['後代傳承方案', '家族發展報告'],
          children: [
            {
              id: '8',
              name: 'Enos',
              parentId: '3',
              level: 2,
              locked: false,
              selected: false,
              reports: ['宗教研究初探']
            },
            {
              id: '9',
              name: 'Noam',
              parentId: '3',
              level: 2,
              locked: false,
              selected: false,
              reports: []
            }
          ]
        },
        {
          id: '4',
          name: 'Abel',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: ['牧羊技術報告']
        },
        {
          id: '5',
          name: 'Awan',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: ['工藝發展史'],
          children: [
            {
              id: '10',
              name: 'Enoch',
              parentId: '5',
              level: 2,
              locked: false,
              selected: false,
              reports: ['城市規劃初步', '建築學基礎']
            }
          ]
        },
        {
          id: '6',
          name: 'Azura',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: []
        },
        {
          id: '7',
          name: 'Awan',  // 故意重複的公司名稱，用於測試「選取同公司提示」功能
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: ['另一部門的工藝報告']
        }
      ]
    } as TreeNode;
  } // TODO

  public performAction(): void {
  } // TODO

  public initializeTree(data: TreeNode | undefined) {
    if (data) {
      // 首先將數據設置到 TreeDataService 中
      this.treeDataService.loadInitialData(data);
    }
    // Create hierarchy and apply tree layout
    const root = d3.hierarchy(data) as HierarchyNode<unknown>;

    // Using nodeSize sets the spacing between nodes
    const tree = d3.tree().nodeSize([this.nodeWidth * 1.5, this.nodeHeight * 2]);

    // Apply layout to calculate positions
    tree(root);

    // Create SVG
    this.svg = d3.select('.tree-visualization')
      .append('svg')
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight)
      .attr('viewBox', [0, 0, this.svgWidth, this.svgHeight])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Create a group to hold all elements with a margin
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.svgWidth / 2}, ${this.nodeHeight})`);

    // Create links first (so they appear behind nodes)
    this.links = this.g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x((d: any) => d.x)  // Use natural x,y for vertical layout
        .y((d: any) => d.y) as any)
      .style('fill', 'none')
      .style('stroke', '#000000')
      .style('stroke-width', '1.5px');

    // Create node groups
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
      .attr('transform', (d: { x: any; y: any; }) => `translate(${d.x},${d.y})`)
      .on('click', (event: any, d: d3.HierarchyNode<unknown>) => this.handleNodeClick(event, d));
    // Add rectangles to nodes - centered on node position
    this.nodes.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', this.nodeHeight)
      .attr('x', -this.nodeWidth / 2)  // Center the rectangle on the node
      .attr('y', -this.nodeHeight / 2) // Center the rectangle on the node
      .style('fill', '#69b3a2')
      .style('stroke', '#000')
      .attr('rx', 5) // Rounded corners
      .attr('ry', 5);

    // Add text labels
    this.nodes.append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .text((d: { data: TreeNode; }) => (d.data as TreeNode).name)
      .style('fill', 'white')
      .style('font-size', '12px');

    return this.svg.node();
  }

  setupZoom(): void {
    console.log('setupZoom');
    // 1. 創建縮放行為
    this.zoom = d3.zoom()
      .scaleExtent([0.3, 5]) // 設置縮放範圍 (最小縮放比例, 最大縮放比例)
      .on('zoom', (event) => {
        // 2. 縮放事件處理
        // 在這裡更新元素的變換
        this.g.attr('transform', event.transform);
        // 更新 TreeState 中的縮放和平移狀態
        this.treeDataService.updateTreeState({
          zoom: event.transform.k,
          pan: {
            x: event.transform.x,
            y: event.transform.y
          }
        });
      });

    // 設置初始變換，使其與初始佈局相匹配
    const initialTransform = d3.zoomIdentity
      .translate(this.svgWidth / 2, this.nodeHeight)
      .scale(1);

    // 3. 將縮放行為應用到 SVG 元素
    this.svg.call(this.zoom)
      .call(this.zoom.transform, initialTransform);
  }

  resetZoom(): void {
    const initialTransform = d3.zoomIdentity
      .translate(this.svgWidth / 2, this.nodeHeight)
      .scale(1);

    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, initialTransform);
  }

  zoomIn(): void {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 1.1);
  }

  zoomOut(): void {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 0.9);
  }

  // TODO 處理節點點擊事件
  private handleNodeClick(event: any, d: d3.HierarchyNode<unknown>) {
    // this.selectedNodeSubject.next(node.data);
    // TODO 更新樹狀圖中的選中狀態...
    event.stopPropagation();
    const nodeData = d.data as TreeNode;
    const nodeId = nodeData.id;
    console.log(nodeId);
    if (nodeId) {
      // 調用服務選擇節點
      this.treeDataService.selectNode(nodeId);

      // 更新視覺顯示
      // 1. 移除所有節點的選中類
      // 重置所有節點樣式
      this.nodes.select('rect')
        .style('fill', '#69b3a2')
        .style('stroke', '#000')
        .style('stroke-width', '1px');

      // 設置選中節點樣式
      d3.select(`#node-${nodeId}`).select('rect')
        .style('fill', '#d4e6f7')
        .style('stroke', '#3498db')
        .style('stroke-width', '3px');
      // 突出顯示同名節點
      const nodeName = nodeData.name;
      if (nodeName) {
        const similarNodes = this.treeDataService.findNodesByName(nodeName);
        this.highlightSimilarNodes(similarNodes, nodeId);
      }

    }
  }

  // TODO 處理按鈕點擊事件
  private handleButtonClick(event: any, buttonData: any) {
    const companyId = d3.select(event.target.closest('.node')).attr('id').replace('company-', '');
    // TODO 根據按鈕類型執行對應操作...
  }

  // TODO 顯示公司報告
  private showCompanyReports(company: TreeNode) {
    // TODO 發出事件通知應用程式顯示報告列表...
  }

  // 突出顯示相同名稱的節點
  highlightSimilarNodes(similarNodes: TreeNode[], currentNodeId: string): void {
    // 1. 首先移除所有之前的高亮並重置樣式
    this.nodes.select('rect')
      .style('stroke', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.selected ? '#3498db' : '#000'; // 選中節點藍色，其他為黑色
      })
      .style('stroke-width', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.selected ? '3px' : '1px';
      })
      .style('stroke-dasharray', null); // 移除虛線效果
    // 2. 如果沒有相似節點，直接返回
    if (!similarNodes || similarNodes.length === 0) {
      return;
    }

    // 3. 過濾掉當前選中的節點
    const nodesToHighlight = similarNodes.filter(node => node.id !== currentNodeId);

    console.log('要高亮的節點數:', nodesToHighlight.length);

    // 4. 為每個相似節點添加高亮
    nodesToHighlight.forEach(node => {
      if (node.id) {
        d3.select(`#node-${node.id}`).select('rect')
          .style('stroke', '#f39c12')  // 橙色邊框
          .style('stroke-width', '2px')
          .style('stroke-dasharray', '5, 3');  // 虛線效果
      }
    });
  }

  resetAllNodeStyles(): void {
    // 重置所有節點樣式到默認狀態
    this.nodes.select('rect')
      .style('fill', '#69b3a2')
      .style('stroke', '#000')
      .style('stroke-width', '1px')
      .style('stroke-dasharray', null);

    // 重新應用選中節點的樣式
    const selectedNodeId = this.treeDataService.getSelectedNodeId();
    if (selectedNodeId) {
      d3.select(`#node-${selectedNodeId}`).select('rect')
        .style('fill', '#d4e6f7')
        .style('stroke', '#3498db')
        .style('stroke-width', '3px');
    }
  }

  updateView(data: TreeNode): void {
    // 清除當前視圖
    if (this.svg) {
      this.svg.selectAll("*").remove();
    }

    // 使用新數據重新初始化樹
    this.initializeTree(data);

    // 重新設置縮放行為
    this.setupZoom();

    // 如果有選中的節點，恢復其選中狀態
    const selectedNodeId = this.treeDataService.getSelectedNodeId();
    if (selectedNodeId) {
      this.highlightNode(selectedNodeId, 'selected');
    }

    // 如果有需要高亮的相似節點，恢復高亮
    const selectedNode = this.treeDataService.getSelectedNode();
    if (selectedNode) {
      const similarNodes = this.treeDataService.findNodesByName(selectedNode.name);
      this.highlightSimilarNodes(similarNodes, selectedNode.id);
    }
  }

// 輔助方法：高亮特定節點
  highlightNode(nodeId: string, className: string): void {
    d3.select(`#node-${nodeId}`).classed(className, true);

    // 如果需要設置樣式而不是類
    d3.select(`#node-${nodeId}`).select('rect')
      .style('fill', '#d4e6f7')
      .style('stroke', '#3498db')
      .style('stroke-width', '3px');
  }


}

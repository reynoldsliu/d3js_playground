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

  public svgWidth = 1200;
  public svgHeight = 800;
  public nodeWidth = 200;
  public nodeHeight = 60;

  // 添加样式配置
  private styles = {
    node: {
      default: {
        fill: '#e8f5e9',
        stroke: '#81c784',
        strokeWidth: '1px'
      },
      selected: {
        fill: '#d4e6f7',
        stroke: '#3498db',
        strokeWidth: '2px'
      },
      similar: {
        stroke: '#f39c12',
        strokeWidth: '2px',
        strokeDash: '5,3'
      },
      credit: {  // 額度樣式
        fill: '#e3f2fd',
        stroke: '#64b5f6',
        strokeWidth: '1px'
      },
      control: {  // 合控樣式
        fill: '#f3e5f5',
        stroke: '#ba68c8',
        strokeWidth: '1px'
      },
      company: {  // 公司（根節點）樣式
        fill: '#e8f5e9',
        stroke: '#2e7d32',
        strokeWidth: '2px'
      }
    },
    link: {
      stroke: '#ccc',
      strokeWidth: '1px',
      opacity: 1
    },
    text: {
      title: {
        size: '14px',
        color: '#333'
      },
      info: {
        size: '12px',
        color: '#666'
      }
    },
    tooltip: {
      icon: {
        size: '16px',
        color: '#666'
      },
      background: '#fff',
      border: '#ccc'
    }
  };

  constructor(private treeDataService: TreeDataService,) {
  }

  public loadTreeData(): TreeNode {
    return {
      id: '1',
      name: '三雅投資股份有限公司',
      position: '總公司',
      level: 0,
      locked: false,
      selected: false,
      parentId: null,
      reports: [],
      type: '合控',
      amount: 1000000000, // 10億
      note:'備註',
      children: [
        {
          id: '2',
          name: '額度A',
          position: '主要額度',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '額度',
          amount: 500000000, // 5億
          children: []
        },
        {
          id: '3',
          name: '合控A',
          position: '主要合控',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '合控',
          amount: 300000000, // 3億
          children: [
            {
              id: '5',
              name: '額度B',
              position: '子額度',
              parentId: '3',
              level: 2,
              locked: false,
              selected: false,
              reports: [],
              type: '額度',
              amount: 200000000, // 2億
              children: []
            }
          ]
        },
        {
          id: '4',
          name: '合控B',
          position: '次要合控',
          parentId: '1',
          level: 1,
          locked: false,
          selected: false,
          reports: [],
          type: '合控',
          amount: 200000000, // 2億
          children: [],
          note:'備註',
        }
      ]
    } as TreeNode;
  }

  public performAction(): void {
  } // TODO

  public initializeTree(data: TreeNode | undefined) {
    if (data) {
      this.treeDataService.loadInitialData(data);
    }

    const root = d3.hierarchy(data) as HierarchyNode<unknown>;
    const tree = d3.tree().nodeSize([this.nodeWidth * 1.5, this.nodeHeight * 3]);
    tree(root);

    // 初始化tooltip
    const tooltip = this.initializeTooltip();

    // Create SVG
    this.svg = d3.select('.tree-visualization')
      .append('svg')
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight)
      .attr('viewBox', [0, 0, this.svgWidth, this.svgHeight])
      .attr('style', 'max-width: 100%; height: auto;');

    // Create a group with margin
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.svgWidth / 2}, ${this.nodeHeight * 2})`);

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

        return `M${sourceX},${sourceY}
                L${sourceX},${midY}
                L${targetX},${midY}
                L${targetX},${targetY}`;
      })
      .style('fill', 'none')
      .style('stroke', this.styles.link.stroke)
      .style('stroke-width', this.styles.link.strokeWidth)
      .style('opacity', this.styles.link.opacity);

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
      .attr('transform', (d: { x: any; y: any; }) => `translate(${d.x},${d.y})`)
      .on('click', (event: any, d: d3.HierarchyNode<unknown>) => this.handleNodeClick(event, d));

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
        if (nodeData.level === 0) return this.styles.node.company.fill;
        if (nodeData.type === '額度') return this.styles.node.credit.fill;
        if (nodeData.type === '合控') return this.styles.node.control.fill;
        return this.styles.node.default.fill;
      })
      .style('stroke', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.selected) return this.styles.node.selected.stroke;
        if (nodeData.level === 0) return this.styles.node.company.stroke;
        if (nodeData.type === '額度') return this.styles.node.credit.stroke;
        if (nodeData.type === '合控') return this.styles.node.control.stroke;
        return this.styles.node.default.stroke;
      })
      .style('stroke-width', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.selected) return this.styles.node.selected.strokeWidth;
        if (nodeData.level === 0) return this.styles.node.company.strokeWidth;
        if (nodeData.type === '額度') return this.styles.node.credit.strokeWidth;
        if (nodeData.type === '合控') return this.styles.node.control.strokeWidth;
        return this.styles.node.default.strokeWidth;
      });

    // Add name text
    this.nodes.append('text')
      .attr('dy', '-0.5em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-name')
      .text((d: { data: TreeNode; }) => (d.data as TreeNode).name)
      .style('fill', this.styles.text.title.color)
      .style('font-size', this.styles.text.title.size)
      .style('font-weight', 'bold');

    // Add position text
    this.nodes.append('text')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-position')
      .text((d: { data: TreeNode; }) => (d.data as TreeNode).position || '')
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // Add percentages text
    this.nodes.append('text')
      .attr('dy', '2.2em')
      .attr('text-anchor', 'middle')
      .attr('class', 'node-percentages')
      .text((d: { data: TreeNode; }) => {
        const node = d.data as TreeNode;
        if (node.type && node.amount) {
          return `${node.type}: ${node.amount.toLocaleString()}元`;
        }
        return '';
      })
      .style('fill', this.styles.text.info.color)
      .style('font-size', this.styles.text.info.size);

    // 在节点组中添加提示图标
    const noteIcons = this.nodes.append('g')
      .attr('class', 'note-icon')
      .style('cursor', 'pointer')
      .style('visibility', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.note ? 'visible' : 'hidden';
      });

    // 添加图标背景圆圈
    noteIcons.append('circle')
      .attr('cx', this.nodeWidth / 2 - 12)
      .attr('cy', -this.nodeHeight / 2 + 12)
      .attr('r', 8)
      .style('fill', '#fff')
      .style('stroke', this.styles.tooltip.icon.color)
      .style('stroke-width', '1px');

    // 添加 "i" 文本作为图标
    noteIcons.append('text')
      .attr('x', this.nodeWidth / 2 - 12)
      .attr('y', -this.nodeHeight / 2 + 12)
      .attr('dy', '0.3em')
      .style('text-anchor', 'middle')
      .style('fill', this.styles.tooltip.icon.color)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('font-family', 'serif')
      .text('i');

    // 修改鼠标事件处理
    let activeTooltip = false;

    noteIcons
      .on('mouseover', (event: any, d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.note) {
          activeTooltip = true;
          tooltip
            .style('visibility', 'visible')
            .text(nodeData.note);

          const iconBox = (event.target as SVGElement).getBoundingClientRect();
          tooltip
            .style('left', `${iconBox.right + 10}px`)
            .style('top', `${iconBox.top}px`);
        }
      })
      .on('mouseout', (event: any) => {
        // 检查鼠标是否真的离开了图标区域
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !event.target.contains(relatedTarget)) {
          activeTooltip = false;
          // 使用短暂延迟来处理鼠标快速移动的情况
          setTimeout(() => {
            if (!activeTooltip) {
              tooltip.style('visibility', 'hidden');
            }
          }, 100);
        }
      })
      .on('click', (event: any) => {
        // 阻止事件冒泡
        event.stopPropagation();
        // 点击时直接隐藏 tooltip
        tooltip.style('visibility', 'hidden');
        activeTooltip = false;
      });

    // 添加对整个文档的点击事件监听
    d3.select('body').on('click', () => {
      if (tooltip) {
        tooltip.style('visibility', 'hidden');
        activeTooltip = false;
      }
    });

    return this.svg.node();
  }

  setupZoom(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.3, 2]) // 调整缩放范围
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
        this.treeDataService.updateTreeState({
          zoom: event.transform.k,
          pan: {
            x: event.transform.x,
            y: event.transform.y
          }
        });
      });

    // 将缩放行为应用到SVG
    this.svg.call(this.zoom);

    // 初始化时自动居中
    this.centerGraph();
  }

  resetZoom(): void {
    if (!this.svg || !this.g) return;

    // 获取所有节点的边界
    const bounds = this.g.node().getBBox();

    // 考虑节点的实际大小和边距
    const padding = 50;
    const effectiveWidth = bounds.width + this.nodeWidth + padding * 2;
    const effectiveHeight = bounds.height + this.nodeHeight + padding * 2;

    // 计算适当的缩放比例
    const scale = Math.min(
      (this.svgWidth - padding * 2) / effectiveWidth,
      (this.svgHeight - padding * 2) / effectiveHeight,
      1.5
    );

    // 计算居中位置，考虑节点的实际大小
    const translateX = (this.svgWidth - effectiveWidth * scale) / 2 - (bounds.x - padding) * scale;
    const translateY = (this.svgHeight - effectiveHeight * scale) / 2 - (bounds.y - padding) * scale;

    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
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
    event.stopPropagation();
    const nodeData = d.data as TreeNode;
    const nodeId = nodeData.id;

    if (nodeId) {
      // 获取当前的变换状态
      const currentTransform = d3.zoomTransform(this.svg.node());

      // 更新节点选择状态
      this.treeDataService.selectNode(nodeId);
      this.updateNodeStyles(nodeId, nodeData.name);

      // 恢复之前的变换状态，防止画面移动
      this.svg.call(this.zoom.transform, currentTransform);
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

  // 新增方法：统一更新节点样式
  private updateNodeStyles(selectedNodeId: string, nodeName: string) {
    // 重置所有节点的选中状态
    this.nodes.select('rect')
      .style('stroke', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) return this.styles.node.company.stroke;
        if (nodeData.type === '額度') return this.styles.node.credit.stroke;
        if (nodeData.type === '合控') return this.styles.node.control.stroke;
        return this.styles.node.default.stroke;
      })
      .style('stroke-width', (d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) return this.styles.node.company.strokeWidth;
        if (nodeData.type === '額度') return this.styles.node.credit.strokeWidth;
        if (nodeData.type === '合控') return this.styles.node.control.strokeWidth;
        return this.styles.node.default.strokeWidth;
      })
      .style('stroke-dasharray', null);

    // 设置选中节点样式
    d3.select(`#node-${selectedNodeId}`).select('rect')
      .style('stroke', this.styles.node.selected.stroke)
      .style('stroke-width', this.styles.node.selected.strokeWidth);

    // 高亮相似节点
    const similarNodes = this.treeDataService.findNodesByName(nodeName);
    this.highlightSimilarNodes(similarNodes, selectedNodeId);
  }

  // 修改 highlightSimilarNodes 方法
  highlightSimilarNodes(similarNodes: TreeNode[], currentNodeId: string): void {
    if (!similarNodes || similarNodes.length === 0) {
      return;
    }

    const nodesToHighlight = similarNodes.filter(node => node.id !== currentNodeId);
    nodesToHighlight.forEach(node => {
      if (node.id) {
        d3.select(`#node-${node.id}`).select('rect')
          .style('stroke', this.styles.node.similar.stroke)
          .style('stroke-width', this.styles.node.similar.strokeWidth)
          .style('stroke-dasharray', this.styles.node.similar.strokeDash);
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
    // 保存当前的变换状态
    const currentTransform = this.svg && this.svg.node() ?
      d3.zoomTransform(this.svg.node()) :
      d3.zoomIdentity.translate(this.svgWidth / 2, this.nodeHeight * 2).scale(1);

    // 清除当前视图
    if (this.svg) {
      this.svg.selectAll("*").remove();
    }

    // 使用新数据重新初始化树
    this.initializeTree(data);

    // 重新设置缩放行为
    this.setupZoom();

    // 恢复之前的变换状态
    this.svg.call(this.zoom.transform, currentTransform);

    // 如果有选中的节点，恢复其选中状态
    const selectedNodeId = this.treeDataService.getSelectedNodeId();
    if (selectedNodeId) {
      const selectedNode = this.treeDataService.getSelectedNode();
      if (selectedNode) {
        this.updateNodeStyles(selectedNodeId, selectedNode.name);
      }
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

  public updateTree(data: TreeNode): void {
    const root = d3.hierarchy(data) as d3.HierarchyNode<TreeNode>;
    const tree = d3.tree<TreeNode>().nodeSize([this.nodeWidth * 1.5, this.nodeHeight * 3]);
    tree(root);

    // 计算树的边界，包含节点的实际大小
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    root.each((d: any) => {
      // 考虑节点的实际大小
      minX = Math.min(minX, d.x - this.nodeWidth / 2);
      maxX = Math.max(maxX, d.x + this.nodeWidth / 2);
      minY = Math.min(minY, d.y - this.nodeHeight / 2);
      maxY = Math.max(maxY, d.y + this.nodeHeight / 2);
    });

    // 添加边距以确保节点不会贴边
    const padding = 50;
    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;

    // 计算适当的缩放比例，确保所有节点可见
    const scale = Math.min(
      (this.svgWidth - padding * 2) / treeWidth,
      (this.svgHeight - padding * 2) / treeHeight,
      1.5 // 限制最大缩放比例为1.5
    );

    // 计算居中位置
    const translateX = (this.svgWidth - treeWidth * scale) / 2 - minX * scale;
    const translateY = (this.svgHeight - treeHeight * scale) / 2 - minY * scale;

    // 创建新的变换
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

    // 更新连接线，使用平滑过渡
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
    const noteIcons = this.nodes.select('.note-icon')
      .style('visibility', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.note ? 'visible' : 'hidden';
      });

    // 应用新的变换，使用过渡动画
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, newTransform);
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
        if (nodeData.level === 0) return '#e8f5e9'; // 根節點用綠色
        return nodeData.type === '額度' ? '#f3e5f5' : '#e3f2fd'; // 額度用紫色，合控用藍色
      })
      .style('stroke', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.level === 0) return '#81c784'; // 根節點用深綠色
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

        if (nodeData.position) {
          nodeGroup.append('text')
            .attr('dy', '1em')
            .attr('text-anchor', 'middle')
            .text(nodeData.position)
            .style('fill', textColor)
            .style('font-size', '12px');
        }
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
          .text(`${nodeData.amount?nodeData.amount.toLocaleString():0}元`)
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

  // 添加自动居中方法
  public centerGraph(): void {
    if (!this.svg || !this.g) return;

    // 获取所有节点的边界
    const bounds = this.g.node().getBBox();

    // 考虑节点的实际大小和边距
    const padding = 50;
    const effectiveWidth = bounds.width + this.nodeWidth + padding * 2;
    const effectiveHeight = bounds.height + this.nodeHeight + padding * 2;

    // 计算适当的缩放比例
    const scale = Math.min(
      (this.svgWidth - padding * 2) / effectiveWidth,
      (this.svgHeight - padding * 2) / effectiveHeight,
      1.5
    );

    // 计算居中位置，考虑节点的实际大小
    const translateX = (this.svgWidth - effectiveWidth * scale) / 2 - (bounds.x - padding) * scale;
    const translateY = (this.svgHeight - effectiveHeight * scale) / 2 - (bounds.y - padding) * scale;

    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }

  private initializeTooltip() {
    // 移除可能存在的旧 tooltip
    d3.select('body').selectAll('.node-tooltip').remove();

    // 创建新的 tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'node-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', this.styles.tooltip.background)
      .style('border', `1px solid ${this.styles.tooltip.border}`)
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none'); // 防止 tooltip 本身捕获鼠标事件

    return tooltip;
  }

  // 在组件销毁时清理 tooltip
  public cleanup(): void {
    d3.select('body').selectAll('.node-tooltip').remove();
    d3.select('body').on('click', null); // 移除点击事件监听
  }

}

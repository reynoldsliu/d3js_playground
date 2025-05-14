import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {TreeNode} from '../interfaces/interfaces';

@Injectable()
export class TreeTooltipService {
  tooltipStyle: any;
  tooltip: any;
  svgWidth: number = 0;
  svgHeight: number = 0;
  nodeWidth: number = 0;
  nodeHeight: number = 0;
  activeTooltip: boolean = false;


  constructor() {
  }

  initializeTooltip(tooltipStyle: any, svgWidth?: number,
                    svgHeight?: number,
                    nodeWidth?: number,
                    nodeHeight?: number) {
    this.setLocalBorder(svgWidth, svgHeight, nodeWidth, nodeHeight);

    this.tooltipStyle = tooltipStyle;
    // 移除舊的 tooltip
    d3.select('body').selectAll('.node-tooltip').remove();

    // 建立新的 tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'node-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', tooltipStyle.background)
      .style('border', `1px solid ${tooltipStyle.border}`)
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none'); // 防止 tooltip 本身攔截滑鼠事件

    return this.tooltip;
  }

  private setLocalBorder(svgWidth: number | undefined, svgHeight: number | undefined, nodeWidth: number | undefined, nodeHeight: number | undefined) {
    if (svgWidth) {
      this.svgWidth = svgWidth;
    }
    if (svgHeight) {
      this.svgHeight = svgHeight;
    }
    if (nodeWidth) {
      this.nodeWidth = nodeWidth;
    }
    if (nodeHeight) {
      this.nodeHeight = nodeHeight;
    }
  }

// 銷毀時清除 tooltip
  public cleanup(): void {
    d3.select('body').selectAll('.node-tooltip').remove();
    d3.select('body').on('click', null); // 移除点击事件监听
  }

  genTooltip(nodes: any, tooltipStyle?: any) {
    if (tooltipStyle) {
      this.tooltipStyle = tooltipStyle;
    }
    const noteIcons = nodes.append('g')
      .attr('class', 'note-icon')
      .style('cursor', 'pointer')
      .style('visibility', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.note ? 'visible' : 'hidden';
      });

    // 添加圓框
    noteIcons.append('circle')
      .attr('cx', this.nodeWidth / 2 - 12)
      .attr('cy', -this.nodeHeight / 2 + 12)
      .attr('r', 8)
      .style('fill', '#fff')
      .style('stroke', this.tooltipStyle.icon.color)
      .style('stroke-width', '1px');

    // 添加i作為符號內容
    noteIcons.append('text')
      .attr('x', this.nodeWidth / 2 - 12)
      .attr('y', -this.nodeHeight / 2 + 12)
      .attr('dy', '0.3em')
      .style('text-anchor', 'middle')
      .style('fill', this.tooltipStyle.icon.color)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('font-family', 'serif')
      .text('i');

    // 修改滑鼠事件處理
    this.activeTooltip = false;

    noteIcons
      .on('mouseover', (event: any, d: any) => {
        const nodeData = d.data as TreeNode;
        if (nodeData.note) {
          this.activeTooltip = true;
          this.tooltip
            .style('visibility', 'visible')
            .text(nodeData.note);

          const iconBox = (event.target as SVGElement).getBoundingClientRect();
          this.tooltip
            .style('left', `${iconBox.right + 10}px`)
            .style('top', `${iconBox.top}px`);
        }
      })
      .on('mouseout', (event: any) => {
        // 檢查滑鼠是否離開圖形
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !event.target.contains(relatedTarget)) {
          this.activeTooltip = false;
          // 使用短暫延遲處理滑鼠快速移動
          setTimeout(() => {
            if (!this.activeTooltip) {
              this.tooltip.style('visibility', 'hidden');
            }
          }, 100);
        }
      })
      .on('click', (event: any) => {
        // 阻止事件冒泡
        event.stopPropagation();
        // 點擊時直接隱藏 tooltip
        this.tooltip.style('visibility', 'hidden');
        this.activeTooltip = false;
      });

    // 對所有文件聆聽事件
    d3.select('body').on('click', () => {
      if (this.tooltip) {
        this.tooltip.style('visibility', 'hidden');
        this.setActiveTooltip(false);
      }
    });

    return noteIcons;
  }

  updateTooltip(nodes: any) {
    return nodes.select('.note-icon')
      .style('visibility', (d: { data: TreeNode; }) => {
        const nodeData = d.data as TreeNode;
        return nodeData.note ? 'visible' : 'hidden';
      });
  }

  setActiveTooltip(active: boolean) {
    this.activeTooltip = active;
  }

}

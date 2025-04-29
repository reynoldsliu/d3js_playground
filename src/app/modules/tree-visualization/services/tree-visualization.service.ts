import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { TreeNode } from '../models/tree-node.model';

/**
 * D3節點數據類型定義
 * 用於處理D3.js中的樹狀結構數據
 */
interface D3Node {
  x: number;
  y: number;
  data: TreeNode;
  children?: D3Node[];
  parent?: D3Node;
}

/**
 * D3連線數據類型定義
 * 用於處理D3.js中的樹狀結構連線
 */
interface D3Link {
  source: D3Node;
  target: D3Node;
}

/**
 * TreeVisualizationService 負責樹狀結構的視覺化處理
 * 提供了初始化樹、渲染、縮放等功能
 * 並處理與 D3.js 相關的操作
 * 
 * @Injectable 標記此服務可被依賴注入系統使用
 */
@Injectable({
  providedIn: 'root'
})
export class TreeVisualizationService {
  /**
   * SVG元素參考
   * @private
   */
  private svg: any;
  
  /**
   * 根節點G元素
   * @private
   */
  private rootG: any;
  
  /**
   * 縮放行為對象
   * @private
   */
  private zoom: any;
  
  /**
   * 樹容器元素
   * @private
   */
  private container: any;
  
  /**
   * 當前縮放級別
   * @private
   */
  private currentZoom = 1;
  
  /**
   * 樹布局邊緣大小
   * @private
   */
  private margin = { top: 20, right: 90, bottom: 30, left: 90 };
  
  /**
   * 樹寬度
   * @private
   */
  private width = 800;
  
  /**
   * 樹高度
   * @private
   */
  private height = 600;

  /**
   * 構造函數
   */
  constructor() { }

  /**
   * 計算樹的高度
   * 返回從根節點到最深葉節點的路徑長度
   * 
   * @param data 樹的數據結構
   * @returns 樹的高度（最長路徑的節點數）
   */
  public getTreeHeight(data: TreeNode | null): number {
    if (!data) {
      return 0;
    }

    // 使用d3.hierarchy創建樹的層次結構
    const root = d3.hierarchy(data, d => d.children);
    
    // 獲取樹的高度（root.height 是最長路徑上的邊數，加1得到節點數）
    const treeHeight = root.height + 1;
    
    return treeHeight;
  }

  /**
   * 初始化樹狀結構視圖
   * @param data 樹數據
   * @returns 初始化後的DOM元素
   */
  public initializeTree(data: TreeNode): HTMLElement {
    // 創建容器
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.overflow = 'hidden';

    // 創建SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // 添加縮放行為的容器
    this.rootG = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // 渲染樹
    this.renderTree(data);

    return this.container;
  }

  /**
   * 設置縮放功能
   */
  public setupZoom(): void {
    // 定義縮放行為
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event: any) => {
        this.rootG.attr('transform', event.transform);
        this.currentZoom = event.transform.k;
      });

    // 應用縮放
    this.svg.call(this.zoom);

    // 初始縮放級別和位置
    this.resetZoom();
  }

  /**
   * 放大視圖
   */
  public zoomIn(): void {
    this.svg.transition().duration(300).call(
      this.zoom.scaleBy, 1.2
    );
  }

  /**
   * 縮小視圖
   */
  public zoomOut(): void {
    this.svg.transition().duration(300).call(
      this.zoom.scaleBy, 0.8
    );
  }

  /**
   * 重置縮放
   */
  public resetZoom(): void {
    this.svg.transition().duration(300).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(this.margin.left, this.margin.top).scale(1)
    );
  }

  /**
   * 渲染樹狀結構
   * @param data 樹數據
   * @private
   */
  private renderTree(data: TreeNode): void {
    // 清空之前的內容
    this.rootG.selectAll('*').remove();

    // 如果沒有數據，返回
    if (!data) return;

    // 創建樹布局
    const treeLayout = d3.tree<TreeNode>().size([this.height - this.margin.top - this.margin.bottom, this.width - this.margin.left - this.margin.right]);

    // 使用 d3.hierarchy 轉換數據
    const root = d3.hierarchy<TreeNode>(data, d => d.children);
    
    // 計算節點位置
    const rootWithLayout = treeLayout(root) as d3.HierarchyPointNode<TreeNode>;

    // 添加連線
    const link = this.rootG.selectAll(".link")
      .data(rootWithLayout.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d: D3Link) => {
        return "M" + d.target.y + "," + d.target.x
          + "C" + (d.target.y + d.source.y) / 2 + "," + d.target.x
          + " " + (d.target.y + d.source.y) / 2 + "," + d.source.x
          + " " + d.source.y + "," + d.source.x;
      })
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", 1.5);

    // 添加節點
    const node = this.rootG.selectAll(".node")
      .data(rootWithLayout.descendants())
      .enter()
      .append("g")
      .attr("class", (d: d3.HierarchyPointNode<TreeNode>) => {
        let classes = "node";
        if (d.data.selected) classes += " selected";
        if (d.data.locked) classes += " locked";
        return classes;
      })
      .attr("transform", (d: d3.HierarchyPointNode<TreeNode>) => `translate(${d.y},${d.x})`)
      .on("click", (event: any, d: d3.HierarchyPointNode<TreeNode>) => {
        this.handleNodeClick(d.data);
      });

    // 添加節點圖形
    node.append("circle")
      .attr("r", 10)
      .style("fill", (d: d3.HierarchyPointNode<TreeNode>) => d.data.locked ? "#f8d7da" : "#fff")
      .style("stroke", (d: d3.HierarchyPointNode<TreeNode>) => d.data.locked ? "#dc3545" : (d.data.selected ? "#007bff" : "#999"))
      .style("stroke-width", (d: d3.HierarchyPointNode<TreeNode>) => d.data.selected ? 3 : 1.5);

    // 添加節點文字
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", (d: d3.HierarchyPointNode<TreeNode>) => d.children ? -13 : 13)
      .style("text-anchor", (d: d3.HierarchyPointNode<TreeNode>) => d.children ? "end" : "start")
      .text((d: d3.HierarchyPointNode<TreeNode>) => d.data.name);

    // 添加備註圖標（如果有備註）
    node.append("text")
      .attr("class", "info-icon")
      .attr("dy", ".35em")
      .attr("x", 25)
      .style("text-anchor", "start")
      .text((d: d3.HierarchyPointNode<TreeNode>) => d.data.note ? "ℹ️" : "")
      .on("mouseover", (event: any, d: d3.HierarchyPointNode<TreeNode>) => {
        this.handleInfoIconHover(event, d.data);
      })
      .on("mouseout", () => {
        this.handleInfoIconLeave();
      });
  }

  /**
   * 處理節點點擊事件
   * @param node 被點擊的節點
   * @private
   */
  private handleNodeClick(node: TreeNode): void {
    // 此處僅為佔位方法，實際功能應由組件實現
    console.log('Node clicked:', node.name);
    // 在實際應用中，這會觸發事件或回調通知組件
  }

  /**
   * 處理信息圖標懸停事件
   * @param event 鼠標事件
   * @param node 相關節點
   * @private
   */
  private handleInfoIconHover(event: MouseEvent, node: TreeNode): void {
    // 此處僅為佔位方法，實際功能應由組件實現
    console.log('Info icon hovered:', node.note);
    // 在實際應用中，這會觸發事件或回調通知組件
  }

  /**
   * 處理信息圖標離開事件
   * @private
   */
  private handleInfoIconLeave(): void {
    // 此處僅為佔位方法，實際功能應由組件實現
    console.log('Info icon left');
    // 在實際應用中，這會觸發事件或回調通知組件
  }

  /**
   * 高亮相似節點
   * @param nodes 要高亮的節點數組
   * @param currentNodeId 當前節點ID
   */
  public highlightSimilarNodes(nodes: TreeNode[], currentNodeId: string): void {
    // 移除所有現有的高亮
    this.rootG.selectAll(".node").classed("highlight-similar", false);

    // 高亮匹配的節點
    this.rootG.selectAll(".node")
      .filter((d: any) => {
        return nodes.some(node => node.id === d.data.id && node.id !== currentNodeId);
      })
      .classed("highlight-similar", true);
  }

  /**
   * 載入假樹數據（用於測試）
   * @returns 樹數據
   */
  public loadTreeData(): TreeNode {
    // 測試數據
    return {
      id: "root",
      name: "金融控股集團",
      level: 0,
      children: [
        {
          id: "bank",
          name: "商業銀行",
          parentId: "root",
          level: 1,
          type: "額度",
          amount: 1000000,
          note: "主要負責傳統銀行業務",
          locked: false,
          reports: ["年度財報", "風險評估報告"],
          children: [
            {
              id: "retail",
              name: "零售銀行部",
              parentId: "bank",
              level: 2,
              type: "額度",
              amount: 500000,
              note: "處理個人客戶業務",
              locked: false,
              reports: ["客戶滿意度調查"]
            },
            {
              id: "corporate",
              name: "企業銀行部",
              parentId: "bank",
              level: 2,
              type: "合控",
              amount: 700000,
              note: "處理企業客戶業務",
              locked: true,
              reports: ["大客戶分析報告"]
            }
          ]
        },
        {
          id: "investment",
          name: "投資銀行",
          parentId: "root",
          level: 1,
          type: "額度",
          amount: 800000,
          note: "負責投資業務和資產管理",
          locked: false,
          reports: ["投資組合報告"],
          children: [
            {
              id: "asset",
              name: "資產管理部",
              parentId: "investment",
              level: 2,
              type: "額度",
              amount: 300000,
              note: "管理客戶資產",
              locked: false,
              reports: []
            }
          ]
        },
        {
          id: "insurance",
          name: "保險公司",
          parentId: "root",
          level: 1,
          type: "合控",
          amount: 600000,
          note: "提供各類保險產品",
          locked: false,
          reports: ["承保報告", "理賠統計"],
          linkedNodes: ["fintech"]
        },
        {
          id: "fintech",
          name: "金融科技部",
          parentId: "root",
          level: 1,
          type: "合控",
          amount: 200000,
          note: "發展金融科技解決方案",
          locked: false,
          reports: ["技術創新報告"],
          linkedNodes: ["insurance"]
        }
      ]
    };
  }
} 
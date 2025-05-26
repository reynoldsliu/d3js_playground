import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import * as d3 from "d3";

@Component({
  selector: 'app-cluster-force-tree',
  templateUrl: './cluster-force-tree.component.html',
  styleUrls: ['./cluster-force-tree.component.scss']
})
export class ClusterForceTreeComponent implements OnInit {

  @ViewChild('graphContainer', { static: true })
  private graphContainer!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.draw();
  }

  draw() {
    const svg = d3.select(this.graphContainer.nativeElement)
      .append('svg')
      .attr('width', 1200)
      .attr('height', 800)
      .attr('viewBox', [0, 0, 1200, 800]);

    const mainGroup = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 原始數據
    const originalData = {
      id: '1',
      name: '艾蕙服飾開發有限公司',
      level: 0,
      children: [
        {
          id: '2',
          name: 'P250001',
          parentId: ['1'],
          level: 1,
          type: '額度',
          amount: 2000,
          state: '新增',
          children: []
        },
        {
          id: '3',
          name: 'P250002',
          parentId: ['1'],
          level: 1,
          type: '合控',
          amount: 500,
          children: [
            {
              id: '5',
              name: 'P250003',
              parentId: ['3'],
              level: 2,
              type: '額度',
              amount: 1000,
              state: '新增',
              children: []
            }
          ]
        },
        {
          id: '4',
          name: 'P250004',
          parentId: ['1'],
          level: 1,
          type: '合控',
          amount: 1300,
          children: [
            {
              id: '6',
              name: 'P250005',
              parentId: ['4'],
              level: 2,
              type: '額度',
              amount: 1000,
              state: '既有',
              children: [
                {
                  id: '8',
                  name: 'P250007',
                  parentId: ['6', '7'],
                  level: 3,
                  type: '額度',
                  amount: 700,
                  state: '既有',
                  hasMultipleParents: true,
                  children: []
                },
                {
                  id: '9',
                  name: 'P250008',
                  parentId: ['6', '7'],
                  level: 3,
                  type: '額度',
                  amount: 800,
                  state: '既有',
                  hasMultipleParents: true,
                  children: []
                }
              ]
            },
            {
              id: '7',
              name: 'P250006',
              parentId: ['4'],
              level: 2,
              type: '合控',
              amount: 1000,
              children: []
            }
          ]
        }
      ]
    };

    // 🎯 步驟1：繪製 Cluster 布局
    const { leafNodes, clusterRoot } = this.drawClusterLayout(mainGroup, originalData);

    // 🎯 步驟2：基於 Cluster 葉節點創建 Force 假數據並繪製
    this.drawForceLayout(mainGroup, leafNodes);
  }

  // 🔵 方法1：繪製 Cluster 布局並返回葉節點信息
  private drawClusterLayout(container: any, data: any) {
    const cluster = d3.cluster().size([1000, 500]);
    const root = d3.hierarchy(data);
    cluster(root);

    // 添加標題
    container.append('text')
      .attr('x', 600)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#495057')
      .text('混合結構：Cluster (上層) + Force (下層)');

    // 偏移 cluster 到上半部
    const clusterGroup = container.append('g')
      .attr('transform', 'translate(100, 80)');

    // 繪製連接線
    const linkGenerator = d3.linkVertical<any, d3.HierarchyNode<any>>()
      .x(node => node.x || 0)
      .y(node => node.y || 0);

    clusterGroup.selectAll(".cluster-link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "cluster-link")
      .attr("d", linkGenerator)
      .style('stroke', '#6c757d')
      .style('stroke-width', 2)
      .style('fill', 'none');

    // 繪製節點
    const node = clusterGroup.selectAll(".cluster-node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "cluster-node")
      .attr("transform", (d:any) => `translate(${d.x},${d.y})`);

    node.append("circle")
      .attr("r", (d: any) => d.depth === 0 ? 12 : 8)
      .style("fill", (d: any) => {
        if (d.depth === 0) return '#495057';
        if (d.data.type === '額度') return '#0d6efd';
        if (d.data.type === '合控') return '#fd7e14';
        return '#6c757d';
      })
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    node.append("text")
      .attr("dy", -15)
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", (d: any) => d.depth === 0 ? "bold" : "normal")
      .text((d: any) => d.data.name);

    node.append("text")
      .attr("dy", 25)
      .style("text-anchor", "middle")
      .style("font-size", "8px")
      .style("fill", "#6c757d")
      .text((d: any) => {
        const info = [];
        if (d.data.amount) info.push(`${d.data.amount}萬`);
        if (d.data.state) info.push(d.data.state);
        return info.join(' | ');
      });

    // 🔍 收集葉節點信息（最底層節點）
    const leafNodes = root.leaves().map((leaf: any) => {
      console.log('處理葉節點:', leaf.data.id, leaf.data.name);
      return {
        id: leaf.data.id,
        name: leaf.data.name,
        x: leaf.x + 100, // 加上 cluster group 的偏移
        y: leaf.y + 80,  // 加上 cluster group 的偏移
        type: leaf.data.type,
        amount: leaf.data.amount,
        state: leaf.data.state,
        isLeaf: true
      };
    });

    console.log('收集到的葉節點:', leafNodes);

    return { leafNodes, clusterRoot: root };
  }

  // 🔴 方法2：基於 Cluster 葉節點創建 Force 布局
  private drawForceLayout(container: any, clusterLeafNodes: any[]) {
    // 🔍 調試：確認葉節點數據
    console.log('Cluster 葉節點:', clusterLeafNodes);

    // 🎯 創建假數據：包含 cluster 葉節點 + 新的 force 節點
    const forceNodes = [
      // 1. 固定的 cluster 葉節點（不可移動）
      ...clusterLeafNodes.map(leaf => ({
        ...leaf,
        fx: leaf.x, // 固定 x 位置
        fy: leaf.y, // 固定 y 位置
        fixed: true,
        nodeType: 'anchor' // 標記為錨點
      })),

      // 2. 新的動態節點（可移動）
      {
        id: 'client-001',
        name: '客戶A',
        type: '客戶',
        amount: 500,
        x: 200,
        y: 650,
        nodeType: 'client'
      },
      {
        id: 'client-002',
        name: '客戶B',
        type: '客戶',
        amount: 800,
        x: 400,
        y: 650,
        nodeType: 'client'
      },
      {
        id: 'client-003',
        name: '客戶C',
        type: '客戶',
        amount: 1200,
        x: 600,
        y: 650,
        nodeType: 'client'
      },
      {
        id: 'client-004',
        name: '客戶D',
        type: '客戶',
        amount: 300,
        x: 800,
        y: 650,
        nodeType: 'client'
      },
      {
        id: 'partner-001',
        name: '合作夥伴A',
        type: '合作夥伴',
        amount: 1500,
        x: 300,
        y: 700,
        nodeType: 'partner'
      },
      {
        id: 'partner-002',
        name: '合作夥伴B',
        type: '合作夥伴',
        amount: 2000,
        x: 700,
        y: 700,
        nodeType: 'partner'
      },
      {
        id: 'supplier-001',
        name: '供應商A',
        type: '供應商',
        amount: 600,
        x: 150,
        y: 750,
        nodeType: 'supplier'
      },
      {
        id: 'supplier-002',
        name: '供應商B',
        type: '供應商',
        amount: 900,
        x: 500,
        y: 750,
        nodeType: 'supplier'
      },
      {
        id: 'supplier-003',
        name: '供應商C',
        type: '供應商',
        amount: 400,
        x: 850,
        y: 750,
        nodeType: 'supplier'
      }
    ];

    // 🎯 動態創建連接關係，確保 ID 匹配
    const forceLinks: any[] = [];

    // 獲取實際的葉節點 ID
    const leafIds = clusterLeafNodes.map(leaf => leaf.id);
    console.log('實際葉節點 IDs:', leafIds);

    // 為每個客戶節點連接到對應的葉節點
    const clientIds = ['client-001', 'client-002', 'client-003', 'client-004'];
    clientIds.forEach((clientId, index) => {
      if (leafIds[index]) {
        forceLinks.push({
          source: leafIds[index],
          target: clientId,
          type: 'business',
          strength: 0.8
        });
      }
    });

    // 為合作夥伴連接到葉節點
    const partnerIds = ['partner-001', 'partner-002'];
    partnerIds.forEach((partnerId, index) => {
      const leafId = leafIds[Math.min(index, leafIds.length - 1)];
      if (leafId) {
        forceLinks.push({
          source: leafId,
          target: partnerId,
          type: 'partnership',
          strength: 0.6
        });
      }
    });

    // 新節點之間的連接
    const additionalLinks = [
      { source: 'client-001', target: 'supplier-001', type: 'supply', strength: 0.4 },
      { source: 'client-002', target: 'supplier-002', type: 'supply', strength: 0.4 },
      { source: 'client-003', target: 'supplier-003', type: 'supply', strength: 0.4 },
      { source: 'client-004', target: 'supplier-001', type: 'supply', strength: 0.3 },
      { source: 'partner-001', target: 'supplier-002', type: 'collaboration', strength: 0.3 },
      { source: 'partner-002', target: 'supplier-003', type: 'collaboration', strength: 0.3 },
      { source: 'client-001', target: 'client-002', type: 'peer', strength: 0.2 },
      { source: 'client-003', target: 'client-004', type: 'peer', strength: 0.2 },
      { source: 'partner-001', target: 'partner-002', type: 'alliance', strength: 0.3 }
    ];

    forceLinks.push(...additionalLinks);

    // 🔍 調試：確認數據
    console.log('Force 節點數量:', forceNodes.length);
    console.log('Force 連接數量:', forceLinks.length);
    console.log('所有節點 IDs:', forceNodes.map(n => n.id));
    console.log('所有連接:', forceLinks.map(l => `${l.source} -> ${l.target}`));
    console.log('錨點節點:', forceNodes.filter(n => n.nodeType === 'anchor'));
    console.log('客戶節點:', forceNodes.filter(n => n.nodeType === 'client'));

    // 🔍 驗證連接的 ID 是否都存在
    const allNodeIds = new Set(forceNodes.map(n => n.id));
    const invalidLinks = forceLinks.filter(link =>
      !allNodeIds.has(link.source) || !allNodeIds.has(link.target)
    );
    if (invalidLinks.length > 0) {
      console.error('無效的連接 (找不到對應節點):', invalidLinks);
    }

    // 🎯 創建 Force Simulation
    const simulation = d3.forceSimulation(forceNodes)
      .force("link", d3.forceLink(forceLinks)
        .id((d: any) => d.id)
        .distance((d: any) => {
          switch (d.type) {
            case 'business': return 100;
            case 'partnership': return 120;
            case 'supply': return 80;
            case 'collaboration': return 90;
            case 'peer': return 60;
            case 'alliance': return 70;
            default: return 80;
          }
        })
        .strength((d: any) => d.strength || 0.5))
      .force("charge", d3.forceManyBody()
        .strength((d: any) => {
          if (d.fixed) return 0; // 固定節點不產生斥力
          return -150;
        }))
      .force("collision", d3.forceCollide()
        .radius((d: any) => {
          if (d.nodeType === 'anchor') return 15;
          if (d.nodeType === 'partner') return 18;
          return 12;
        }))
      .force("y", d3.forceY((d: any) => {
        if (d.fixed) return d.fy; // 固定節點保持原位置
        // 非固定節點被拉向下方
        if (d.nodeType === 'client') return 650;
        if (d.nodeType === 'partner') return 700;
        if (d.nodeType === 'supplier') return 750;
        return 650;
      }).strength((d: any) => d.fixed ? 1.0 : 0.3))
      .alphaDecay(0.02)
      .alpha(0.3);

    // 🎯 創建 Force 圖形的專用容器
    const forceGroup = container.append("g").attr("class", "force-container");

    // 🎯 繪製 Force 連接線
    const link = forceGroup.selectAll(".force-link")
      .data(forceLinks)
      .enter()
      .append("line")
      .attr("class", "force-link")
      .style('stroke', (d: any) => {
        switch (d.type) {
          case 'business': return '#28a745';
          case 'partnership': return '#fd7e14';
          case 'supply': return '#6f42c1';
          case 'collaboration': return '#20c997';
          case 'peer': return '#6c757d';
          case 'alliance': return '#e83e8c';
          default: return '#6c757d';
        }
      })
      .style('stroke-width', (d: any) => {
        switch (d.type) {
          case 'business': return 3;
          case 'partnership': return 3;
          default: return 2;
        }
      })
      .style('stroke-dasharray', (d: any) => {
        if (d.type === 'peer' || d.type === 'alliance') return '3,3';
        return 'none';
      })
      .style('opacity', 0.7);

    // 🎯 繪製 Force 節點
    const node = forceGroup.selectAll(".force-node")
      .data(forceNodes)
      .enter()
      .append("g")
      .attr("class", "force-node")
      .call(this.drag(simulation));

    // 節點樣式
    node.append("circle")
      .attr("r", (d: any) => {
        if (d.nodeType === 'anchor') return 8; // 錨點節點稍小
        if (d.nodeType === 'partner') return 15;
        return 12;
      })
      .style("fill", (d: any) => {
        if (d.nodeType === 'anchor') return '#dc3545'; // 錨點用紅色標示
        if (d.nodeType === 'client') return '#28a745';
        if (d.nodeType === 'partner') return '#fd7e14';
        if (d.nodeType === 'supplier') return '#6f42c1';
        return '#6c757d';
      })
      .style("stroke", "#fff")
      .style("stroke-width", 2)
      .style("opacity", 1);

    // 節點標籤
    node.append("text")
      .attr("dy", (d: any) => d.nodeType === 'anchor' ? -12 : -18)
      .style("text-anchor", "middle")
      .style("font-size", (d: any) => d.nodeType === 'anchor' ? "8px" : "10px")
      .style("font-weight", (d: any) => d.nodeType === 'anchor' ? "bold" : "normal")
      .style("fill", "#333")
      .text((d: any) => d.name);

    // 金額標籤
    node.append("text")
      .attr("dy", (d: any) => d.nodeType === 'anchor' ? 20 : 25)
      .style("text-anchor", "middle")
      .style("font-size", "8px")
      .style("fill", "#666")
      .text((d: any) => d.amount ? `${d.amount}萬` : '');

    // 🎯 Force Simulation 更新
    simulation.on("tick", () => {
      // 確保只更新 force 容器內的元素
      forceGroup.selectAll(".force-link")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      forceGroup.selectAll(".force-node")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // 🎯 添加圖例
    this.addLegend(container);
  }

  // 拖拽功能（只允許非固定節點拖拽）
  private drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
    function dragstarted(event: any, d: any) {
      if (d.fixed) return; // 固定節點不可拖拽
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      if (d.fixed) return; // 固定節點不可拖拽
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (d.fixed) return; // 固定節點不可拖拽
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // 添加圖例
  private addLegend(container: any) {
    const legend = container.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(50, 600)");

    const legendData = [
      { color: "#dc3545", text: "錨點 (Cluster葉節點)", type: "anchor" },
      { color: "#28a745", text: "客戶", type: "client" },
      { color: "#fd7e14", text: "合作夥伴", type: "partner" },
      { color: "#6f42c1", text: "供應商", type: "supplier" }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem.append("circle")
        .attr("r", 6)
        .style("fill", item.color);

      legendItem.append("text")
        .attr("x", 15)
        .attr("y", 5)
        .text(item.text)
        .style("font-size", "11px");
    });
  }
}

import {Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener} from '@angular/core';
import {Subscription} from 'rxjs';
import * as d3 from 'd3';
import {TreeNode} from '../../interfaces/interfaces';
import {TreeVisualizationService} from '../../services/tree-visualization-service';
import {range} from 'd3';
import {TreeDataService} from '../../services/tree-data-service';
import { DialogService } from 'primeng/dynamicdialog';
import { NodeEditDialogComponent } from '../node-edit-dialog/node-edit-dialog.component';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-tree-visualization',
  templateUrl: './tree-visualization.component.html',
  styleUrls: ['./tree-visualization.component.scss'],
  providers: [DialogService]
})
export class TreeVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('treeContainer', {static: true}) public treeContainer!: ElementRef;
  @ViewChild('tooltip') tooltip!: ElementRef;
  private subscription: Subscription | undefined;
  private treeDataSubscription: Subscription | undefined;

  selectedNode: TreeNode | null = null;
  hoveredNode: TreeNode | null = null;
  private zoom: any;
  private svg: any;
  public data: TreeNode | null = null;
  private linkedNodes: Set<string> = new Set();
  protected isQueryingLinks: boolean = false;
  showTooltip: boolean = false;
  tooltipX: number = 0;
  tooltipY: number = 0;

  constructor(private treeVisualizationService: TreeVisualizationService,
              private treeDataService: TreeDataService,
              private dialogService: DialogService) {
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.showTooltip) {
      this.tooltipX = event.clientX + 10;
      this.tooltipY = event.clientY + 10;
    }
  }

  ngOnInit(): void {
    // 訂閱選中節點變化
    this.subscription = this.treeDataService.selectedNode$.subscribe(
      (selectedNode: TreeNode | null) => {
        this.selectedNode = selectedNode;
      }
    );

    // 載入數據 (只在第一次初始化時)
    this.loadTreeData();
  }

  ngAfterViewInit(): void {
    // 訂閱樹數據變化 - 確保在視圖初始化後再訂閱
    this.treeDataSubscription = this.treeDataService.treeData$.subscribe(
      data => {
        if (data) {
          this.data = data;
          this.renderTree(data);
        }
      }
    );
  }

  private renderTree(data: TreeNode | null): void {
    console.log('Rendering tree');

    if(data === null){
      return;
    }

    // 添加防止無限循環的標誌
    if (this.isRefreshing) {
      console.warn('已在進行渲染，跳過本次渲染');
      return;
    }

    try {
      this.isRefreshing = true;

      // 清空容器
      while (this.treeContainer.nativeElement.firstChild) {
        this.treeContainer.nativeElement.removeChild(this.treeContainer.nativeElement.firstChild);
      }

      // 初始化樹
      const initNode = this.treeVisualizationService.initializeTree(data);
      this.treeContainer.nativeElement.appendChild(initNode);

      // 設置縮放功能
      this.treeVisualizationService.setupZoom();
    } finally {
      // 確保標誌被重置
      this.isRefreshing = false;
    }
  }

  loadTreeData(): void {
    if (this.treeDataService.getTreeData() === null) {
      const initialData = this.treeVisualizationService.loadTreeData();
      this.treeDataService.loadInitialData(initialData);
    }
  }

  zoomIn() {
    this.treeVisualizationService.zoomIn();
  }

  zoomOut() {
    this.treeVisualizationService.zoomOut();
  }

  resetZoom() {
    this.treeVisualizationService.resetZoom();
  }

// 添加一個標誌來防止無限循環
  private isRefreshing = false;

  createNode(): void {
    const newNode: TreeNode = {
      id: this.treeDataService.generateUniqueId(),
      name: '',
      parentId: this.selectedNode?.id || null,
      level: this.selectedNode ? (this.selectedNode.level || 0) + 1 : 0,
      locked: false,
      selected: false,
      reports: [],
      type: '額度',
      amount: 0,
      note: ''
    };

    const ref = this.dialogService.open(NodeEditDialogComponent, {
      header: '新增節點',
      width: '400px',
      data: {
        node: newNode,
        isNew: true,
        readOnly: false
      }
    });

    ref.onClose.subscribe((result: any) => {
      if (result?.action === 'confirm') {
        this.treeDataService.addNode(this.selectedNode?.id || null, result.node);
      }
    });
  }

  deleteNode(): void {
    if (!this.selectedNode || !this.selectedNode.id) {
      return;
    }

    if(this.selectedNode.children) {
      // 確認刪除
      if (confirm(`確定要刪除 "${this.selectedNode.name}" 及其子節點嗎？`)) {
        this.treeDataService.deleteNode(this.selectedNode.id);
      }
    }
  }

  selectedNodes(): void {
  }

  editNode(): void {
    if (!this.selectedNode) return;

    const ref = this.dialogService.open(NodeEditDialogComponent, {
      header: '編輯節點',
      width: '400px',
      data: {
        node: { ...this.selectedNode },
        isNew: false,
        readOnly: this.selectedNode.locked
      }
    });

    ref.onClose.subscribe((result: any) => {
      if (result?.action === 'confirm') {
        this.treeDataService.updateNode(this.selectedNode!.id, result.node);
      }
    });
  }

  linkNode(): void {
    if (!this.selectedNode || !this.selectedNode.id) {
      return;
    }

    // 這可能需要更複雜的UI，比如顯示一個對話框讓用戶選擇要關聯的節點
    // 這裡使用簡單對話框示範
    const targetId = prompt("請輸入要關聯的節點ID：");
    if (!targetId) return;

    // 關聯節點
    this.treeDataService.linkNodes(this.selectedNode.id, targetId);
  }

  toggleLock(): void {
    if (!this.selectedNode || !this.selectedNode.id) {
      return;
    }

    // 鎖定/解鎖節點
    const newLockedState = !this.selectedNode.locked;
    this.treeDataService.toggleLockNode(this.selectedNode.id, newLockedState);
  }

  showReports(): void {
    if (!this.selectedNode || !this.selectedNode.reports || this.selectedNode.reports.length === 0) {
      alert('此節點沒有報告');
      return;
    }

    // 這裡你可以選擇如何顯示報告
    // 方法1: 簡單地使用 alert 顯示報告列表
    const reportsList = this.selectedNode.reports.join('\n- ');
    alert(`${this.selectedNode.name} 的報告：\n- ${reportsList}`);

    // 方法2: 如果你想實現更複雜的報告顯示，可以考慮使用模態對話框或側邊欄的詳細視圖
    // this.openReportsModal(this.selectedNode.reports);
  }

  highlightSimilarNodes(): void {
    if (!this.selectedNode || !this.selectedNode.name) {
      return;
    }

    // 查找同名節點
    const similarNodes = this.treeDataService.findNodesByName(this.selectedNode.name);
    console.log('找到同名節點:', similarNodes.length);

    // 在視覺化服務中高亮這些節點
    if (this.selectedNode.id) {
      this.treeVisualizationService.highlightSimilarNodes(similarNodes, this.selectedNode.id);
    }
  }

  ngOnDestroy(): void {
    // 取消訂閱，避免記憶體洩漏
    if (this.treeDataSubscription) {
      this.treeDataSubscription.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private showNodeInfo(node: TreeNode): void {
    const ref = this.dialogService.open(NodeEditDialogComponent, {
      header: '節點資訊',
      width: '400px',
      data: {
        node: node,
        isNew: false,
        readOnly: true
      }
    });
  }

  /**
   * Unlinks the selected node from all its connections
   */
  unlinkNode(): void {
    if (!this.selectedNode) return;

    // Remove the node from the linked nodes set
    this.linkedNodes.delete(this.selectedNode.id);

    // Remove the node from other nodes' linked nodes
    this.data?.children?.forEach(child => {
      if (child.linkedNodes?.includes(this.selectedNode!.id)) {
        child.linkedNodes = child.linkedNodes.filter(id => id !== this.selectedNode!.id);
      }
    });

    // Clear the selected node's linked nodes
    this.selectedNode.linkedNodes = [];

    this.renderTree(this.data);
  }

  /**
   * Queries and highlights all nodes linked to the selected node
   */
  queryLinkedNodes(): void {
    if (!this.selectedNode) return;
    console.log(this.isQueryingLinks);
    if (this.isQueryingLinks) {
      // Clear all highlights
      this.linkedNodes.clear();
      this.isQueryingLinks = false;
    } else {
      // Add the selected node and its linked nodes to the set
      this.linkedNodes.add(this.selectedNode.id);
      this.selectedNode.linkedNodes?.forEach(id => {
        this.linkedNodes.add(id);
      });
      this.isQueryingLinks = true;
    }

    this.renderTree(this.data);
  }

  addNode(node: TreeNode): void {
    if (!this.data) return;

    if (!this.data.children) {
      this.data.children = [];
    }

    this.data.children.push(node);
    this.renderTree(this.data);
  }

  updateNode(updatedNode: TreeNode): void {
    if (!this.data) return;

    const updateNodeInTree = (node: TreeNode): boolean => {
      if (node.id === updatedNode.id) {
        Object.assign(node, updatedNode);
        return true;
      }

      if (node.children) {
        for (const child of node.children) {
          if (updateNodeInTree(child)) {
            return true;
          }
        }
      }

      return false;
    };

    updateNodeInTree(this.data);
    this.renderTree(this.data);
  }
}

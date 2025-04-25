import {Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
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
  private subscription: Subscription | undefined;
  private treeDataSubscription: Subscription | undefined;


  selectedNode: TreeNode | null = null;
  private zoom: any;
  private svg: any;
  public data: TreeNode | null = null;
  constructor(private treeVisualizationService: TreeVisualizationService,
              private treeDataService: TreeDataService,
              private dialogService: DialogService) {
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

  private renderTree(data: TreeNode): void {
    console.log('Rendering tree');

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
    // 獲取新節點的名稱
    const name = prompt("請輸入新節點名稱：");
    if (!name) return;

    // 獲取節點類型
    const type = prompt("請輸入節點類型（額度/合控）：", '額度');
    if (!type || (type !== '額度' && type !== '合控')) {
      alert('節點類型必須是「額度」或「合控」');
      return;
    }

    // 獲取金額
    const amountStr = prompt("請輸入金額：", '0');
    const amount = parseInt(amountStr || '0', 10);
    if (isNaN(amount)) {
      alert('金額必須是有效的數字');
      return;
    }

    const parentId = this.selectedNode ? this.selectedNode.id : null;

    // 創建新節點對象
    const newNode: TreeNode = {
      id: this.treeDataService.generateUniqueId(),
      name: name,
      parentId: parentId,
      level: this.selectedNode ? (this.selectedNode.level || 0) + 1 : 0,
      locked: false,
      selected: false,
      reports: [],
      type: type as '額度' | '合控',
      amount: amount
    };

    // 添加到樹中
    this.treeDataService.addNode(parentId, newNode);
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
    if (!this.selectedNode) {
      return;
    }

    // 使用對話框編輯節點屬性
    const newName = prompt("請輸入新的節點名稱：", this.selectedNode.name);
    if (!newName) return;

    const newType = prompt("請輸入節點類型（額度/合控）：", this.selectedNode.type || '額度');
    if (!newType || (newType !== '額度' && newType !== '合控')) {
      alert('節點類型必須是「額度」或「合控」');
      return;
    }

    const newAmount = prompt("請輸入金額：", this.selectedNode.amount?.toString() || '0');
    const parsedAmount = parseInt(newAmount || '0', 10);
    if (isNaN(parsedAmount)) {
      alert('金額必須是有效的數字');
      return;
    }

    // 更新節點
    this.treeDataService.updateNode(this.selectedNode.id, {
      ...this.selectedNode,
      name: newName,
      type: newType as '額度' | '合控',
      amount: parsedAmount
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
}

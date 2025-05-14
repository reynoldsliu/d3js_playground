import {Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener} from '@angular/core';
import {Subscription} from 'rxjs';
import {TreeNode} from '../../modules/tree-visualization/interfaces/interfaces';
import {TreeVisualizationService} from '../../modules/tree-visualization/services/tree-visualization-service';
import {TreeDataService} from '../../modules/tree-visualization/services/tree-data-service';
import {DialogService} from 'primeng/dynamicdialog';
import {NodeEditDialogComponent} from '../node-edit-dialog/node-edit-dialog.component';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TreeDragDropService} from '../../modules/tree-visualization/services/tree-drag-drop-service';
import {TreeZoomService} from '../../modules/tree-visualization/services/tree-zoom-service';
import {TreeStyleService} from '../../modules/tree-visualization/services/tree-style-service';

@Component({
  selector: 'app-tree-visualization',
  templateUrl: './tree-visualization.component.html',
  styleUrls: ['./tree-visualization.component.scss'],
  providers: [DialogService]
})
export class TreeVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {

  // 添加一個標誌來防止無限循環
  private isRefreshing = false;

  @ViewChild('treeContainer', {static: true}) public treeContainer!: ElementRef;
  @ViewChild('tooltip') tooltip!: ElementRef;

  private subscription: Subscription | undefined;
  private treeDataSubscription: Subscription | undefined;
  private dragDropSubscription: Subscription | undefined;

  public dragMode: 'reorder' | 'nest' = 'nest'; // 預設為嵌套模式
  public data: TreeNode | null = null;
  selectedNode: TreeNode | null = null;
  hoveredNode: TreeNode | null = null;
  showTooltip: boolean = false;
  tooltipX: number = 0;
  tooltipY: number = 0;

  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private treeVisualizationService: TreeVisualizationService,
              private treeDataService: TreeDataService,
              private treeDragDropService: TreeDragDropService,
              private treeZoomService: TreeZoomService,
              private treeStyleService: TreeStyleService,
              private dialogService: DialogService) {
    this.form = this.fb.group({
      dragMode: ['nest'] // 默認值
    });
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

    // 初始設置
    this.treeDragDropService.setDragMode(this.dragMode);

    // 監聽拖放模式變化
    this.form.get('dragMode')!.valueChanges.subscribe(mode => {
      this.dragMode = mode;
      this.treeDragDropService.setDragMode(mode);
    });

    // 載入數據 (只在第一次初始化時)
    this.loadTreeData();
  }

  ngAfterViewInit(): void {
    // 訂閱樹數據變化 - 確保在視圖初始化後再訂閱
    this.treeDataSubscription = this.treeDataService.treeData$.subscribe(
      data => {
        if (data) {
          this.data = data;
          const containerElement = this.treeContainer.nativeElement;
          containerElement.classList.add('tree-drag-container');
          this.renderTree(data);
        }
      });
    // 訂閱拖放完成事件
    this.dragDropSubscription = this.treeDragDropService.dragDropCompleted$.subscribe(
      ({sourceId, targetId}) => {
        // 調用數據服務移動節點
        this.treeDataService.moveNode(sourceId, targetId);
        // 數據服務會通知所有訂閱者，包括負責渲染的訂閱
      }
    );
  }

  private renderTree(data: TreeNode | null): void {

    if (data === null) {
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
      this.setUpZoom();
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
    this.treeZoomService.zoomIn();
  }

  zoomOut() {
    this.treeZoomService.zoomOut();
  }

  setUpZoom() {
    this.treeZoomService.setupZoom(
      this.treeVisualizationService.svg,
      this.treeVisualizationService.g
    );
    this.treeZoomService.resetZoom(
      this.treeVisualizationService.nodeWidth,
      this.treeVisualizationService.nodeHeight,
      this.treeVisualizationService.svgWidth,
      this.treeVisualizationService.svgHeight,
    );
  }

  reset() {
    const treeRoot = this.treeDataService.getTreeData();
    if (treeRoot) {
      this.treeDataService.selectNode(treeRoot.id);
    }

    this.setUpZoom();
  }


  createNode(): void {
    // Get the current tree height
    const currentTreeHeight = this.treeVisualizationService.getCurrentTreeHeight();

    // Check if adding to an "額度" node
    if (this.selectedNode?.type === '額度') {
      alert('額度無法新增子節點');
      return;
    }

    // If we have a selected node, check its level
    if (this.selectedNode) {
      const selectedLevel = this.selectedNode.level || 0;

      // If adding to a node at level 3, we would exceed the max tree height of 4
      if (selectedLevel >= 4) {
        alert('資料層數超過限制 無法新增子節點');
        return;
      }

      // For "合控" nodes, we auto-add a child, so level 2 is as deep as we can go
      if (selectedLevel === 3 && currentTreeHeight >= 4) {
        alert('資料層數將超過限制 無法新增子節點');
        return;
      }
    }

    const newNode: TreeNode = {
      id: this.treeDataService.generateUniqueId(),
      name: '',
      parentId: this.selectedNode?.id || null,
      level: this.selectedNode ? (this.selectedNode.level || 0) + 1 : 0,
      locked: false,
      selected: false,
      reports: [],
      type: undefined, // 移除類型，讓用戶在對話框中選擇
      amount: 0,
      note: ''
    };

    const ref = this.dialogService.open(NodeEditDialogComponent, {
      header: '新增關聯',
      width: '650px',
      data: {
        node: newNode,
        isNew: true,
        readOnly: false
      }
    });

    ref.onClose.subscribe((result: any) => {
      if (result?.action === 'confirm') {

        // Only proceed if adding won't exceed tree height limit
        this.treeDataService.getHeightAsync(result.node).then(addedNodeHeight => {
          const forecastHeight = (this.treeDataService.getSelectedNode()?.level ?? 1) + addedNodeHeight;
          if (forecastHeight >= 4) {
            alert('資料層數超過限制 無法新增子節點: from tree-visualization.component.ts');
            return;
          }
          // 實作 移動節點邏輯 節點若是被新增 則從提案底下被移除
          else {
            this.treeDataService.deleteNode(result.node.id);
            this.treeDataService.addNode(this.selectedNode?.id || null, result.node);

          }
        });
      }
    });
  }

  deleteNode(): void {
    if (!this.selectedNode || !this.selectedNode.id) {
      return;
    }

    // 構建確認消息
    let confirmMessage = `確定要刪除 "${this.selectedNode.name}"`;
    if (this.selectedNode.children && this.selectedNode.children.length > 0) {
      confirmMessage += ` 及其 ${this.selectedNode.children.length} 個子節點`;
    }
    confirmMessage += '嗎？';

    // 確認刪除
    if (confirm(confirmMessage)) {
      // 保存當前被刪除節點的ID，用於後續檢查
      const deletedNodeId = this.selectedNode.id;

      // 刪除節點
      this.treeDataService.deleteNode(deletedNodeId);

      // 清空側邊欄資料 - 將選中節點設為null
      this.treeDataService.selectNode(null);
    }
  }

  editNode(): void {
    if (!this.selectedNode) {
      return;
    }

    const ref = this.dialogService.open(NodeEditDialogComponent, {
      header: '編輯節點',
      width: '400px',
      data: {
        node: {...this.selectedNode},
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

  showReports(): void {
    if (!this.selectedNode || !this.selectedNode.reports || this.selectedNode.reports.length === 0) {
      alert('此節點沒有報告');
      return;
    }

    const reportsList = this.selectedNode.reports.join('\n- ');
    alert(`${this.selectedNode.name} 的報告：\n- ${reportsList}`);
  }

  highlightSimilarNodes(): void {
    if (!this.selectedNode || !this.selectedNode.name) {
      return;
    }

    // 查找同名節點
    const similarNodes = this.treeDataService.findNodesByName(this.selectedNode.name);

    if (this.selectedNode.id) {
      this.treeStyleService.highlightSimilarNodes(similarNodes, this.selectedNode.id);
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
    if (this.dragDropSubscription) {
      this.dragDropSubscription.unsubscribe();
    }
  }

}

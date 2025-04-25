import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {TreeNode, TreeState} from '../interfaces/interfaces';
import {v4 as uuidv4} from 'uuid';

@Injectable({providedIn: 'root'})
export class TreeDataService {
  private treeDataSubject = new BehaviorSubject<TreeNode | null>(null);
  treeData$ = this.treeDataSubject.asObservable();

  // 當前選中節點的 BehaviorSubject
  private selectedNodeSubject = new BehaviorSubject<TreeNode | null>(null);
  selectedNode$ = this.selectedNodeSubject.asObservable();

  // 樹狀視圖狀態
  private treeStateSubject = new BehaviorSubject<TreeState>({
    expandedNodeIds: [],
    zoom: 1,
    pan: {x: 0, y: 0}
  });
  treeState$ = this.treeStateSubject.asObservable();

  constructor() {

  }

  // 載入初始數據
  loadInitialData(data: TreeNode): void {
    this.treeDataSubject.next(data);
  }

  // 在 TreeDataService 中
  notifyDataChanged(): void {
    // 獲取當前數據並重新發出，觸發訂閱者更新
    const currentData = this.treeDataSubject.getValue();
    if (currentData) {
      // 創建新對象以確保引用變化
      this.treeDataSubject.next({...currentData});
    }
  }

  // 選擇節點
  selectNode(nodeId: string): void {
    // TODO: 實現選擇節點邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    // 創建數據的深拷貝以避免直接修改
    const newData = this.deepCloneTree(currentData);

    // 重置所有節點的選擇狀態
    this.resetSelection(newData);

    // 找到並選中目標節點
    const targetNode = this.getNodeByIdRecursion(newData, nodeId);
    if (targetNode) {
      targetNode.selected = true;
      // 更新選中節點的主題
      this.selectedNodeSubject.next(targetNode);
    }

    // 發出更新後的樹數據
    this.treeDataSubject.next(newData);
  }

  // 新增節點
  addNode(parentId: string | null, newNode: TreeNode): void {
    // TODO: 實現新增節點邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    const newData = this.deepCloneTree(currentData);
    if (parentId) {
      const targetNode = this.getNodeByIdRecursion(newData, parentId);
      if (targetNode) {
        // 初始化 children 陣列如果不存在
        if (!targetNode.children) {
          targetNode.children = [];
        }
        // 設置正確的 parentId 和 level
        if (!newNode.id) {
          newNode.id = this.generateUniqueId();
        }
        newNode.parentId = parentId;
        newNode.level = (targetNode.level || 0) + 1;
        // 初始化其他屬性
        newNode.locked = newNode.locked || false;
        newNode.selected = false; // 新添加的節點通常不會預設為選中狀態
        newNode.reports = newNode.reports || [];

        // 添加節點到父節點的 children 中
        targetNode.children.push(newNode);
      }
    } else {
      // 如果沒有 parentId，則添加為根節點的子節點
      // 通常這種情況較少見，但處理以防萬一
      if (!newData.children) {
        newData.children = [];
      }

      // 如果頂層節點沒有 level，初始化為 0
      if (parentId === null && newData.level === undefined) {
        newData.level = 0;
      } else {
        newNode.level = 1;
      }
      newNode.parentId = newData.id;
      newData.children.push(newNode);
    }

    this.treeDataSubject.next(newData);
  }

  // 編輯節點
  updateNode(nodeId: string, updates: TreeNode): void {
    // TODO: 實現編輯節點邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    // 創建數據的深拷貝以避免直接修改
    const newData = this.deepCloneTree(currentData);
    // 找到並選中目標節點
    let targetNode = this.getNodeByIdRecursion(newData, nodeId);
    if (targetNode) {
      // 更新節點屬性，保留現有屬性
      Object.assign(targetNode, updates);

      // 特別處理不應該被覆蓋的屬性
      if (updates.id && updates.id !== nodeId) {
        console.warn('不能更改節點ID');
        targetNode.id = nodeId; // 確保ID不變
      }
      // 更新選中節點的主題
      this.treeDataSubject.next(newData);
    }
  }

  // 刪除節點
  deleteNode(nodeId: string): void {
    // TODO: 實現刪除節點邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    // 不允許刪除根節點
    if (currentData.id === nodeId) {
      console.warn('無法刪除根節點');
      return;
    }

    const newData = this.deepCloneTree(currentData);
    const targetNode = this.getNodeByIdRecursion(newData, nodeId);

    if (!targetNode) {
      console.warn('未找到要刪除的節點');
      return;
    }

    // 檢查是否有子節點
    // if (targetNode.children && targetNode.children.length > 0) {
    //   console.warn('無法刪除帶有子節點的節點');
    //   return;
    // }

    // 確保有父節點ID
    if (!targetNode.parentId) {
      console.warn('節點缺少父節點ID');
      return;
    }

    const parentNode = this.getNodeByIdRecursion(newData, targetNode.parentId);
    if (parentNode && parentNode.children) {
      // 從父節點的子節點列表中移除該節點
      parentNode.children = parentNode.children.filter(node => node.id !== nodeId);

      // optional: 如果父節點的子節點為空，可以考慮移除children屬性
      if (parentNode.children.length === 0) {
        delete parentNode.children;
      }

      // 發出更新後的樹
      this.treeDataSubject.next(newData);
    } else {
      console.warn('找不到父節點或父節點沒有子節點');
    }
  }

  // 鎖定/解鎖節點
  toggleLockNode(nodeId: string, locked: boolean): void {
    // TODO: 實現鎖定/解鎖邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }
    const newData = this.deepCloneTree(currentData);
    const targetNode = this.getNodeByIdRecursion(newData, nodeId);
    if (targetNode) {
      targetNode.locked = locked;
    }
    // 發出更新後的樹
    this.treeDataSubject.next(newData);
  }

  // 節點關聯
  linkNodes(sourceId: string, targetId: string): void {
    // TODO: 實現節點關聯邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData || sourceId === targetId) {
      return;
    }
    const newData = this.deepCloneTree(currentData);
    const sourceNode = this.getNodeByIdRecursion(newData, sourceId);
    if (sourceNode) {
      if (!sourceNode.relatedTo) {
        sourceNode.relatedTo = [];
      }
      if (!sourceNode.relatedTo.includes(targetId)) {
        sourceNode.relatedTo?.push(targetId);
      } else {
        console.warn('關聯已存在');
      }
    } else {
      console.warn('找不到節點' + sourceId);
    }
    const targetNode = this.getNodeByIdRecursion(newData, targetId);
    if (targetNode) {
      if (!targetNode.relatedTo) {
        targetNode.relatedTo = [];
      }
      if (!targetNode.relatedTo.includes(sourceId)) {
        targetNode.relatedTo?.push(sourceId);
      } else {
        console.warn('關聯已存在');
      }
    } else {
      console.warn('找不到節點' + targetId);
    }
    // 發出更新後的樹
    this.treeDataSubject.next(newData);
  }

  // 取消節點關聯
  unlinkNodes(sourceId: string, targetId: string): void {
    // TODO: 實現取消節點關聯邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData || sourceId === targetId) {
      return;
    }
    const newData = this.deepCloneTree(currentData);
    const sourceNode = this.getNodeByIdRecursion(newData, sourceId);
    if (sourceNode) {
      if (sourceNode.relatedTo && sourceNode.relatedTo.includes(targetId)) {
        sourceNode.relatedTo = sourceNode.relatedTo.filter(r => r !== targetId);
        if (sourceNode.relatedTo.length === 0) {
          delete sourceNode.relatedTo;
        }
      } else {
        console.warn('找不到已存在關聯' + sourceId);
      }
    } else {
      console.warn('找不到節點' + sourceId);
    }
    const targetNode = this.getNodeByIdRecursion(newData, targetId);
    if (targetNode) {
      if (targetNode.relatedTo && targetNode.relatedTo.includes(sourceId)) {
        targetNode.relatedTo = targetNode.relatedTo.filter(r => r !== sourceId);
        if (targetNode.relatedTo.length === 0) {
          delete targetNode.relatedTo;
        }
      } else {
        console.warn('找不到已存在關聯' + targetId);
      }
    } else {
      console.warn('找不到節點' + targetId);
    }
// 發出更新後的樹
    this.treeDataSubject.next(newData);
  }

  // 查找相同名稱的節點
  findNodesByName(name: string): TreeNode[] {
    // TODO: 實現查找相同名稱節點的邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return [];
    }

    // 不需要複製數據，因為我們只是讀取，不修改
    const result: TreeNode[] = [];
    this.collectNodesByName(currentData, name, result);
    return result;
  }

  // 獲取當前樹狀視圖狀態
  getTreeState(): TreeState {
    return this.treeStateSubject.getValue();
  }

  // 更新樹狀視圖狀態
  updateTreeState(updates: Partial<TreeState>): void {
    this.treeStateSubject.next({
      ...this.treeStateSubject.getValue(),
      ...updates
    });
  }

  getNodeByIdRecursion(root: TreeNode, nodeId: string): TreeNode | null {
    // 先檢查當前節點
    if (root.id === nodeId) {
      return root;
    }

    // 如果有子節點，遞迴搜尋
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        const found = this.getNodeByIdRecursion(child, nodeId);
        if (found) {
          return found;
        }
      }
    }

    // 未找到
    return null;
  }

  private collectNodesByName(node: TreeNode, matchName: string, result: TreeNode[]): void {
    // 檢查當前節點名稱是否匹配
    if (node.name === matchName) {
      result.push(node);
    }

    // 遞迴檢查所有子節點
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this.collectNodesByName(child, matchName, result);
      }
    }
  }

  // 重置所有節點的選擇狀態
  private resetSelection(node: TreeNode): void {
    node.selected = false;
    if (node.children) {
      node.children.forEach(child => this.resetSelection(child));
    }
  }

// 深拷貝樹
  private deepCloneTree(node: TreeNode): TreeNode {
    const clone = {...node};
    if (node.children) {
      clone.children = node.children.map(child => this.deepCloneTree(child));
    }
    return clone;
  }

  generateUniqueId(): string {
    return uuidv4();
  }

  public getSelectedNodeId(): string | null {
    const selectedNode = this.selectedNodeSubject.getValue();
    return selectedNode ? selectedNode.id : null;
  }

  public getSelectedNode(): TreeNode | null {
    return this.selectedNodeSubject.getValue();
  }

  getTreeData(): TreeNode | null {
    return this.treeDataSubject.getValue();
  }
}

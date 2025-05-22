import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {TreeNode, TreeState} from '../interfaces/interfaces';
import {v4 as uuidv4} from 'uuid';

@Injectable({providedIn: 'root'})
export class TreeDataService {
  treeDataSubject = new BehaviorSubject<TreeNode | null>(null);
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
  selectNode(nodeId: string | null): void {
    if (nodeId === null) {
      // 清空選擇
      this.deselectNode();
      return;
    }

    // 以下為原有邏輯
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    // 創建數據的深拷貝以避免直接修改
    const newData = this.deepCloneTree(currentData);

    // 重置所有節點的選擇狀態
    this.resetSelection(newData);

    // 找到並選中目標節點
    const targetNode = this.getNodeByIdRecursion(newData, [nodeId]);
    if (targetNode) {
      targetNode.selected = true;
      // 更新選中節點的主題
      this.selectedNodeSubject.next(targetNode);
    }

    // 發出更新後的樹數據
    this.treeDataSubject.next(newData);
  }

  // 清除節點選擇
  deselectNode(): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    // 創建數據的深拷貝以避免直接修改
    const newData = this.deepCloneTree(currentData);

    // 重置所有節點的選擇狀態
    this.resetSelection(newData);

    // 清空選中節點
    this.selectedNodeSubject.next(null);

    // 發出更新後的樹數據
    this.treeDataSubject.next(newData);
  }

  // 新增關聯
  addNode(parentId: string | null, newNode: TreeNode): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return;
    }

    const newData = this.deepCloneTree(currentData);
    console.log(newData);
    if (parentId) {
      const targetNode = this.getNodeByIdRecursion(newData, [parentId]);
      console.log(targetNode);
      if (targetNode) {
        // 初始化 children 陣列如果不存在
        if (!targetNode.children) {
          targetNode.children = [];
        }
        // 設置正確的 parentId 和 level
        if (!newNode.id) {
          newNode.id = this.generateUniqueId();
        }
        newNode.parentId = [parentId];
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
      newNode.parentId = [newData.id];
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
    let targetNode = this.getNodeByIdRecursion(newData, [nodeId]);
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
    const targetNode = this.getNodeByIdRecursion(newData, [nodeId]);

    if (!targetNode) {
      console.warn('未找到要刪除的節點');
      return;
    }

    // 確保有父節點ID
    if (!targetNode.parentId) {
      console.warn('節點缺少父節點ID');
      return;
    }

    const parentNode = this.getNodeByIdRecursion(newData, targetNode.parentId);
    if (parentNode && parentNode.children && parentNode.children.length > 1) {
      // 暫存被移除的節點
      const deletedNode = parentNode.children.filter(node => node.id === nodeId)[0];
      // 從父節點的子節點列表中移除該節點
      parentNode.children = parentNode.children.filter(node => node.id !== nodeId);
      // 將被移除的節點新增回提案底下
      if (!newData.children) {
        newData.children = [];
      }
      // TODO 需重構邏輯
      const addBackDeletedNode = this.findNodeById(deletedNode.id);
      if (!addBackDeletedNode) {
        newData.children.push(deletedNode);
      }

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

  // 移動節點 - 根據模式決定操作
  moveNode(sourceId: string, targetId: string, mode: 'reorder' | 'nest' = 'nest'): void {

    if (mode === 'reorder') {
      this.reorderNode(sourceId, targetId);
    } else {
      this.nestNode(sourceId, targetId);
    }
  }

// 重新排序節點
  private reorderNode(sourceId: string, targetId: string): void {

    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      console.error('No current data available');
      return;
    }

    const newData = this.deepCloneTree(currentData);

    // 找到源節點和目標節點
    const sourceNode = this.getNodeByIdRecursion(newData, [sourceId]);
    const targetNode = this.getNodeByIdRecursion(newData, [targetId]);

    if (!sourceNode || !targetNode) {
      console.error('Source or target node not found');
      return;
    }

    // 確保兩者有相同的父節點
    if (sourceNode.parentId !== targetNode.parentId) {
      console.error('Nodes must have the same parent for reordering');
      return;
    }

    // 獲取父節點
    const parentNode = sourceNode.parentId ?
      this.getNodeByIdRecursion(newData, sourceNode.parentId) :
      newData; // 如果是頂層節點，使用根節點

    if (!parentNode || !parentNode.children) {
      console.error('Parent node not found or has no children');
      return;
    }

    // 在父節點的子節點數組中找到源節點和目標節點的索引
    const sourceIndex = parentNode.children.findIndex(child => child.id === sourceId);
    const targetIndex = parentNode.children.findIndex(child => child.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      console.error('Source or target node not found in parent\'s children');
      return;
    }

    // 交換位置
    [parentNode.children[sourceIndex], parentNode.children[targetIndex]] =
      [parentNode.children[targetIndex], parentNode.children[sourceIndex]];

    // 發出更新後的樹數據
    this.treeDataSubject.next(newData);
  }

// 嵌套節點
  private nestNode(sourceId: string, targetId: string): void {

    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      console.error('No current data available');
      return;
    }

    const newData = this.deepCloneTree(currentData);

    // 找到源節點和目標節點
    const sourceNode = this.getNodeByIdRecursion(newData, [sourceId]);
    const targetNode = this.getNodeByIdRecursion(newData, [targetId]);

    if (!sourceNode || !targetNode) {
      console.error('Source or target node not found');
      return;
    }

    // 檢查循環依賴 - 確保目標節點不是源節點的子節點
    if (this.isDescendant(sourceNode, targetId)) {
      console.error('Cannot move a node to its own descendant');
      return;
    }

    // 檢查是否已經是目標節點的子節點
    if (sourceNode.parentId?.includes(targetId)) {
      return;
    }

    // 從原父節點中移除源節點
    if (sourceNode.parentId) {
      const oldParent = this.getNodeByIdRecursion(newData, sourceNode.parentId);
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter(child => child.id !== sourceId);
        // 如果父節點的子節點數組為空，可以刪除該屬性
        if (oldParent.children.length === 0) {
          delete oldParent.children;
        }
      }
    } else if (newData.id !== sourceId) {
      // 如果是頂層節點（但不是根節點）
      if (newData.children) {
        newData.children = newData.children.filter(child => child.id !== sourceId);
        if (newData.children.length === 0) {
          delete newData.children;
        }
      }
    }

    // 初始化目標節點的子節點數組（如果不存在）
    if (!targetNode.children) {
      targetNode.children = [];
    }

    // 更新源節點的父節點ID和層級
    sourceNode.parentId = [targetId];
    sourceNode.level = (targetNode.level || 0) + 1;

    // 遞迴更新所有子節點的層級
    this.updateChildrenLevels(sourceNode);

    // 將源節點添加到目標節點的子節點數組
    targetNode.children.push(sourceNode);

    // 發出更新後的樹數據
    this.treeDataSubject.next(newData);
  }

// 檢查節點是否是另一個節點的後代
  isDescendant(node: TreeNode | null, possibleDescendantId: string | undefined): boolean {
    if (!node || !node.children || !possibleDescendantId) {
      return false;
    }

    return node.children.some(child =>
      child.id === possibleDescendantId || this.isDescendant(child, possibleDescendantId)
    );
  }

// 更新節點及其所有子節點的層級
  private updateChildrenLevels(node: TreeNode): void {
    if (!node.children) {
      return;
    }

    node.children.forEach(child => {
      child.level = (node.level || 0) + 1;
      this.updateChildrenLevels(child);
    });
  }

  // 查找相同名稱的節點
  findNodesByName(name: string): TreeNode[] {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) {
      return [];
    }

    // 不需要複製數據，因為我們只是讀取，不修改
    const result: TreeNode[] = [];
    // TODO 修正演算法
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

  getNodeByIdRecursion(root: TreeNode, nodeId: string[]): TreeNode | null {
    // 先檢查當前節點
    if (nodeId.includes(root.id)) {
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
    // 檢查當前節點名稱是否相同
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

// 深複製
  deepCloneTree(node: TreeNode): TreeNode {
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

  getChildrenIds(nodeId?: string): string[] {
    if (!nodeId) {
      return [];
    }
    const root = this.treeDataSubject.getValue();
    if (!root) {
      return [];
    }
    const node = this.getNodeByIdRecursion(root, [nodeId]);
    const children = node?.children;
    if (!children) {
      return [];
    }
    const result: string[] = [nodeId];
    children.map(child => child.id).forEach(childId => {
      result.push(childId);
    });
    return result;
  }

  async getHeightAsync(node: TreeNode | null): Promise<number> {
    return this.getHeight(node);
  }

  getHeight(node: TreeNode | null): number {
    if (!node) {
      return 0;
    }
    if (node.children) {
      let highest = 0;
      for (const child of node.children) {
        const childHeight = this.getHeight(child);
        if (childHeight > highest) {
          highest = childHeight;
        }
      }
      return highest + 1;
    } else {
      return 1;
    }
  }

  // 根據ID查找節點數據
  findNodeById(nodeId: string, root?:TreeNode): TreeNode | null {
    // 從當前樹數據中查找
    let treeData = root || null;
    if (!treeData) {
      treeData = this.getTreeData();
    }

    const findNode = (node: TreeNode | null): TreeNode | null => {
      if(node === null) {return null;}
      if (node.id === nodeId) {
        return node;
      }

      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };
    return findNode(treeData);
  }
}

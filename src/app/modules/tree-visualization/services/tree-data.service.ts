import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TreeNode } from '../models/tree-node.model';

/**
 * TreeDataService 負責管理樹狀結構數據和相關操作
 * 提供了數據訪問、增刪改查等功能
 * 使用 Observable 模式允許組件訂閱數據變化
 * 
 * @Injectable 標記此服務可被依賴注入系統使用
 */
@Injectable({
  providedIn: 'root'
})
export class TreeDataService {
  /**
   * 用於存儲和廣播樹數據的 BehaviorSubject
   * @private
   */
  private treeDataSubject = new BehaviorSubject<TreeNode | null>(null);
  
  /**
   * 用於存儲和廣播當前選中節點的 BehaviorSubject
   * @private
   */
  private selectedNodeSubject = new BehaviorSubject<TreeNode | null>(null);
  
  /**
   * 公開的樹數據 Observable，供組件訂閱
   */
  public treeData$: Observable<TreeNode | null> = this.treeDataSubject.asObservable();
  
  /**
   * 公開的選中節點 Observable，供組件訂閱
   */
  public selectedNode$: Observable<TreeNode | null> = this.selectedNodeSubject.asObservable();

  /**
   * 構造函數
   */
  constructor() { }

  /**
   * 載入初始數據
   * @param data 初始樹數據
   */
  public loadInitialData(data: TreeNode): void {
    this.treeDataSubject.next(data);
  }

  /**
   * 獲取當前樹數據
   * @returns 當前樹數據或 null
   */
  public getTreeData(): TreeNode | null {
    return this.treeDataSubject.getValue();
  }

  /**
   * 生成唯一ID
   * @returns 唯一ID字符串
   */
  public generateUniqueId(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }

  /**
   * 設置選中節點
   * @param node 要選中的節點
   */
  public setSelectedNode(node: TreeNode | null): void {
    this.selectedNodeSubject.next(node);
  }

  /**
   * 添加節點到樹中
   * @param parentId 父節點ID，如為null則添加到根節點
   * @param newNode 新節點數據
   */
  public addNode(parentId: string | null, newNode: TreeNode): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    if (!parentId) {
      // 添加到根節點
      if (!currentData.children) {
        currentData.children = [];
      }
      currentData.children.push(newNode);
    } else {
      // 遞歸查找父節點並添加
      this.addNodeToParent(currentData, parentId, newNode);
    }

    // 通知更新
    this.treeDataSubject.next({ ...currentData });
  }

  /**
   * 遞歸查找父節點並添加新節點
   * @param node 當前處理的節點
   * @param parentId 父節點ID
   * @param newNode 新節點數據
   * @returns 添加是否成功
   * @private
   */
  private addNodeToParent(node: TreeNode, parentId: string, newNode: TreeNode): boolean {
    if (node.id === parentId) {
      if (!node.children) {
        node.children = [];
      }
      node.children.push(newNode);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (this.addNodeToParent(child, parentId, newNode)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 更新節點數據
   * @param nodeId 要更新的節點ID
   * @param updatedNode 更新後的節點數據
   */
  public updateNode(nodeId: string, updatedNode: TreeNode): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    // 遞歸更新節點
    this.updateNodeById(currentData, nodeId, updatedNode);

    // 通知更新
    this.treeDataSubject.next({ ...currentData });

    // 如果當前選中的是被更新的節點，也更新選中節點
    const selectedNode = this.selectedNodeSubject.getValue();
    if (selectedNode && selectedNode.id === nodeId) {
      this.selectedNodeSubject.next({ ...updatedNode });
    }
  }

  /**
   * 遞歸查找並更新節點
   * @param node 當前處理的節點
   * @param nodeId 要更新的節點ID
   * @param updatedNode 更新後的節點數據
   * @returns 更新是否成功
   * @private
   */
  private updateNodeById(node: TreeNode, nodeId: string, updatedNode: TreeNode): boolean {
    if (node.id === nodeId) {
      Object.assign(node, updatedNode);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (this.updateNodeById(child, nodeId, updatedNode)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 刪除節點
   * @param nodeId 要刪除的節點ID
   */
  public deleteNode(nodeId: string): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    // 如果是刪除根節點
    if (currentData.id === nodeId) {
      this.treeDataSubject.next(null);
      this.selectedNodeSubject.next(null);
      return;
    }

    // 遞歸刪除節點
    this.deleteNodeById(currentData, nodeId);

    // 通知更新
    this.treeDataSubject.next({ ...currentData });

    // 如果當前選中的是被刪除的節點，清空選中
    const selectedNode = this.selectedNodeSubject.getValue();
    if (selectedNode && selectedNode.id === nodeId) {
      this.selectedNodeSubject.next(null);
    }
  }

  /**
   * 遞歸查找並刪除節點
   * @param node 當前處理的節點
   * @param nodeId 要刪除的節點ID
   * @returns 刪除是否成功
   * @private
   */
  private deleteNodeById(node: TreeNode, nodeId: string): boolean {
    if (node.children) {
      const index = node.children.findIndex(child => child.id === nodeId);
      if (index !== -1) {
        node.children.splice(index, 1);
        return true;
      }

      for (const child of node.children) {
        if (this.deleteNodeById(child, nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 查找與指定名稱匹配的所有節點
   * @param name 要查找的節點名稱
   * @returns 匹配的節點數組
   */
  public findNodesByName(name: string): TreeNode[] {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return [];

    const result: TreeNode[] = [];
    this.findNodesByNameRecursive(currentData, name, result);
    return result;
  }

  /**
   * 遞歸查找匹配名稱的節點
   * @param node 當前處理的節點
   * @param name 要查找的名稱
   * @param result 結果數組，用於收集匹配的節點
   * @private
   */
  private findNodesByNameRecursive(node: TreeNode, name: string, result: TreeNode[]): void {
    if (node.name === name) {
      result.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        this.findNodesByNameRecursive(child, name, result);
      }
    }
  }

  /**
   * 切換節點的鎖定狀態
   * @param nodeId 節點ID
   * @param lockState 新的鎖定狀態
   */
  public toggleLockNode(nodeId: string, lockState: boolean): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    // 遞歸更新節點鎖定狀態
    this.toggleLockNodeById(currentData, nodeId, lockState);

    // 通知更新
    this.treeDataSubject.next({ ...currentData });

    // 如果當前選中的是被更新的節點，也更新選中節點
    const selectedNode = this.selectedNodeSubject.getValue();
    if (selectedNode && selectedNode.id === nodeId) {
      selectedNode.locked = lockState;
      this.selectedNodeSubject.next({ ...selectedNode });
    }
  }

  /**
   * 遞歸查找並更新節點鎖定狀態
   * @param node 當前處理的節點
   * @param nodeId 要更新的節點ID
   * @param lockState 新的鎖定狀態
   * @returns 更新是否成功
   * @private
   */
  private toggleLockNodeById(node: TreeNode, nodeId: string, lockState: boolean): boolean {
    if (node.id === nodeId) {
      node.locked = lockState;
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (this.toggleLockNodeById(child, nodeId, lockState)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 關聯兩個節點
   * @param sourceId 源節點ID
   * @param targetId 目標節點ID
   */
  public linkNodes(sourceId: string, targetId: string): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    // 查找源節點和目標節點
    const sourceNode = this.findNodeById(currentData, sourceId);
    const targetNode = this.findNodeById(currentData, targetId);

    if (sourceNode && targetNode) {
      // 添加關聯
      if (!sourceNode.linkedNodes) {
        sourceNode.linkedNodes = [];
      }
      if (!targetNode.linkedNodes) {
        targetNode.linkedNodes = [];
      }

      // 避免重複關聯
      if (!sourceNode.linkedNodes.includes(targetId)) {
        sourceNode.linkedNodes.push(targetId);
      }
      if (!targetNode.linkedNodes.includes(sourceId)) {
        targetNode.linkedNodes.push(sourceId);
      }

      // 通知更新
      this.treeDataSubject.next({ ...currentData });

      // 如果當前選中的是被更新的節點，也更新選中節點
      const selectedNode = this.selectedNodeSubject.getValue();
      if (selectedNode && (selectedNode.id === sourceId || selectedNode.id === targetId)) {
        this.selectedNodeSubject.next(selectedNode.id === sourceId ? { ...sourceNode } : { ...targetNode });
      }
    }
  }

  /**
   * 查找指定ID的節點
   * @param node 當前處理的節點
   * @param nodeId 要查找的節點ID
   * @returns 找到的節點或null
   * @private
   */
  private findNodeById(node: TreeNode, nodeId: string): TreeNode | null {
    if (node.id === nodeId) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const foundNode = this.findNodeById(child, nodeId);
        if (foundNode) {
          return foundNode;
        }
      }
    }

    return null;
  }

  /**
   * 解除節點關聯
   * @param sourceId 源節點ID
   * @param targetId 目標節點ID
   */
  public unlinkNodes(sourceId: string, targetId: string): void {
    const currentData = this.treeDataSubject.getValue();
    if (!currentData) return;

    // 查找源節點和目標節點
    const sourceNode = this.findNodeById(currentData, sourceId);
    const targetNode = this.findNodeById(currentData, targetId);

    if (sourceNode && targetNode) {
      // 移除關聯
      if (sourceNode.linkedNodes) {
        const index = sourceNode.linkedNodes.indexOf(targetId);
        if (index !== -1) {
          sourceNode.linkedNodes.splice(index, 1);
        }
      }

      if (targetNode.linkedNodes) {
        const index = targetNode.linkedNodes.indexOf(sourceId);
        if (index !== -1) {
          targetNode.linkedNodes.splice(index, 1);
        }
      }

      // 通知更新
      this.treeDataSubject.next({ ...currentData });

      // 如果當前選中的是被更新的節點，也更新選中節點
      const selectedNode = this.selectedNodeSubject.getValue();
      if (selectedNode && (selectedNode.id === sourceId || selectedNode.id === targetId)) {
        this.selectedNodeSubject.next(selectedNode.id === sourceId ? { ...sourceNode } : { ...targetNode });
      }
    }
  }
} 
/**
 * 樹節點介面定義樹狀結構中每個節點的數據結構
 * 包含節點的基本信息以及與其他節點的關係
 */
export interface TreeNode {
  /**
   * 節點的唯一識別符
   */
  id: string;
  
  /**
   * 節點名稱
   */
  name: string;
  
  /**
   * 父節點ID，用於建立節點間的層級關係
   * 如果為null或undefined，則表示該節點為根節點
   */
  parentId?: string | null;
  
  /**
   * 節點在樹中的層級
   * 根節點通常為0，子節點依次增加
   */
  level?: number;
  
  /**
   * 子節點集合
   */
  children?: TreeNode[];
  
  /**
   * 節點是否被鎖定
   * 被鎖定的節點將無法編輯
   */
  locked?: boolean;
  
  /**
   * 節點是否被選中
   * 用於UI顯示和交互
   */
  selected?: boolean;
  
  /**
   * 與節點關聯的報告列表
   */
  reports?: string[];
  
  /**
   * 與節點相關的其他節點IDs
   */
  relatedTo?: string[];
  
  /**
   * 節點相關職位信息
   */
  position?: string;
  
  /**
   * 節點類型
   * 目前支持「額度」和「合控」兩種類型
   */
  type?: '額度' | '合控';
  
  /**
   * 節點金額數值
   */
  amount?: number;
  
  /**
   * 節點備註信息
   */
  note?: string;
  
  /**
   * 與此節點關聯的節點IDs
   */
  linkedNodes?: string[];
}

/**
 * 樹狀操作類型枚舉
 * 定義對樹節點可以執行的操作類型
 */
export enum TreeActionType {
  SELECT_NODE = 'select_node',
  ADD_NODE = 'add_node',
  EDIT_NODE = 'edit_node',
  DELETE_NODE = 'delete_node',
  LOCK_NODE = 'lock_node',
  UNLOCK_NODE = 'unlock_node',
  LINK_NODES = 'link_nodes',
  UNLINK_NODES = 'unlink_nodes'
}

/**
 * 樹狀視圖狀態接口
 * 用於保存樹狀視圖的當前狀態
 */
export interface TreeState {
  /**
   * 當前選中節點的ID
   */
  selectedNodeId?: string;
  
  /**
   * 已展開節點的IDs集合
   */
  expandedNodeIds: string[];
  
  /**
   * 當前縮放級別
   */
  zoom: number;
  
  /**
   * 當前平移位置
   */
  pan: { x: number, y: number };
} 
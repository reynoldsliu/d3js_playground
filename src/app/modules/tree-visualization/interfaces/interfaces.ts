// 基本節點介面
export interface TreeNode {
  id: string;               // 唯一識別碼，不應該是可選的
  name: string;             // 公司/節點名稱
  parentId?: string | null;        // 父節點 ID
  level?: number;           // 層級
  children?: TreeNode[];    // 子節點
  _children?: TreeNode[]; // Collapsed nodes storage
  collapsed?: boolean;
  locked?: boolean;         // 是否鎖定
  selected?: boolean;       // 是否被選中
  reports?: string[];       // 報告內容
  relatedTo?: string[];    // 相關節點
  type?: string;   // 節點類型
  currency?: string; // 幣別
  amount?: number;          // 金額
  state?: string;
  note?: string;           // 備註內容
  linkedNodes?: string[];
  hasMultipleParents?: boolean;
}

// 樹狀視圖狀態
export interface TreeState {
  selectedNodeId?: string;
  expandedNodeIds: string[];
  zoom: number;
  pan: { x: number, y: number };
}

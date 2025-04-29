import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TreeNode } from '../../models/tree-node.model';

/**
 * NodeEditDialogComponent 是用於創建和編輯樹節點的對話框組件
 * 提供表單界面供用戶輸入節點詳細信息
 * 支持新建節點、編輯現有節點和只讀模式查看節點信息
 * 
 * @class
 */
@Component({
  selector: 'app-node-edit-dialog',
  templateUrl: './node-edit-dialog.component.html',
  styleUrls: ['./node-edit-dialog.component.scss']
})
export class NodeEditDialogComponent implements OnInit {
  /**
   * 當前操作的節點數據
   * 在構造函數中從對話框配置中獲取
   */
  node: TreeNode;

  /**
   * 標記是否為新節點
   * 用於在對話框中顯示適當的標題和按鈕
   */
  isNew: boolean;

  /**
   * 標記節點是否為只讀模式
   * 當為 true 時，所有輸入控件將被禁用
   */
  readOnly: boolean;

  /**
   * 可選的節點類型列表
   * 用於下拉選擇控件
   */
  nodeTypes = [
    { label: '額度', value: '額度' },
    { label: '合控', value: '合控' }
  ];

  /**
   * 構造函數
   * 
   * @param ref 對話框引用，用於控制對話框關閉
   * @param config 對話框配置，包含傳入的節點數據和模式設置
   */
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    // 複製節點數據以避免直接修改原始數據
    this.node = { ...config.data.node };
    this.isNew = config.data.isNew;
    this.readOnly = config.data.readOnly;
  }

  /**
   * 初始化鉤子
   * 在組件初始化時執行任何必要的設置
   */
  ngOnInit(): void {
    // 確保所有必需的屬性都已設置
    // 注意：不再默認設置node.type，讓用戶自行選擇
    
    if (this.node.amount === undefined) {
      this.node.amount = 0;
    }
    
    if (!this.node.note) {
      this.node.note = '';
    }
  }

  /**
   * 驗證表單輸入是否有效
   * 檢查所有必填字段是否已填寫
   * 
   * @returns 如果所有必填字段都已填寫則返回 true，否則返回 false
   */
  isValid(): boolean {
    return !!this.node.name && 
           !!this.node.type && 
           this.node.amount !== undefined && 
           this.node.amount !== null;
  }

  /**
   * 處理確認按鈕點擊事件
   * 如果表單有效，則關閉對話框並返回更新後的節點數據
   */
  onConfirm(): void {
    if (this.isValid()) {
      this.ref.close({
        action: 'confirm',
        node: this.node
      });
    }
  }

  /**
   * 處理取消按鈕點擊事件
   * 關閉對話框而不保存任何更改
   */
  onCancel(): void {
    this.ref.close({
      action: 'cancel'
    });
  }
} 
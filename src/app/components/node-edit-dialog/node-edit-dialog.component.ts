import {Component, OnInit} from '@angular/core';
import {DynamicDialogRef, DynamicDialogConfig} from 'primeng/dynamicdialog';
import {TreeNode} from '../../modules/tree-visualization/interfaces/interfaces';

/**
 * NodeEditDialogComponent is a dialog component for creating and editing tree nodes.
 * It provides a form interface for users to input node details including type, name, and amount.
 *
 * @Component
 * @selector app-node-edit-dialog
 * @templateUrl ./node-edit-dialog.component.html
 * @styleUrls ['./node-edit-dialog.component.scss']
 */
@Component({
  selector: 'app-node-edit-dialog',
  templateUrl: './node-edit-dialog.component.html',
  styleUrls: ['./node-edit-dialog.component.scss']
})
export class NodeEditDialogComponent implements OnInit {

  node: TreeNode;
  isNew: boolean;
  readOnly: boolean;

  nodeTypes = [
    {label: '額度', value: '額度' as const},
    {label: '合控', value: '合控' as const},
  ];

  selectedNode: TreeNode | null = null;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.node = {...config.data.node};
    this.isNew = config.data.isNew;
    this.readOnly = config.data.readOnly;
  }

  ngOnInit(): void {
    // 確保必要的屬性已初始化，但不設預設類型讓使用者選擇
    if (this.node.amount === undefined) {
      this.node.amount = 0;
    }

    if (!this.node.note) {
      this.node.note = '';
    }
  }

  isValid(): boolean {
    return !!this.node.name &&
      !!this.node.type &&
      this.node.amount !== undefined &&
      this.node.amount !== null;
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.ref.close({
        action: 'confirm',
        node: this.node
      });
    }
  }

  onCancel(): void {
    this.ref.close({
      action: 'cancel'
    });
  }

  // Handle the node selection event from child component
  onNodeSelected(node: any): void {
    this.selectedNode = node;
    if (node) {
      this.node = node;
    }
  }

}

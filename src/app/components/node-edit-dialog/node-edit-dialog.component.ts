import {Component, OnInit} from '@angular/core';
import {DynamicDialogRef, DynamicDialogConfig} from 'primeng/dynamicdialog';
import {TreeNode} from '../../interfaces/interfaces';
import {DropdownChangeEvent} from 'primeng/dropdown';
import {TreeVisualizationService} from '../../services/tree-visualization-service';

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
  /**
   * The node being edited or created
   * @type {TreeNode}
   */
  node: TreeNode;

  /**
   * Indicates whether the node is new or existing
   * @type {boolean}
   */
  isNew: boolean;

  /**
   * Indicates whether the node is read-only
   * @type {boolean}
   */
  readOnly: boolean;

  /**
   * Available node types for selection
   * @type {Array<{label: string, value: string}>}
   */
  nodeTypes = [
    {label: '額度', value: '額度' as const},
    {label: '合控', value: '合控' as const},
  ];

  selectedNode: TreeNode | null = null;

  /**
   * Constructs a new NodeEditDialogComponent
   * @param {DynamicDialogRef} ref - Reference to the dialog
   * @param {DynamicDialogConfig} config - Configuration object containing dialog data
   */
  constructor(
    private treeVisualizationService: TreeVisualizationService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.node = {...config.data.node};
    this.isNew = config.data.isNew;
    this.readOnly = config.data.readOnly;
  }

  /**
   * Initialize component with default values
   * Ensures required properties are available
   */
  ngOnInit(): void {
    // 確保必要的屬性已初始化，但不設置默認類型讓用戶選擇
    if (this.node.amount === undefined) {
      this.node.amount = 0;
    }

    if (!this.node.note) {
      this.node.note = '';
    }
  }

  /**
   * Validates the form inputs
   * @returns {boolean} True if all required fields are filled, false otherwise
   */
  isValid(): boolean {
    return !!this.node.name &&
      !!this.node.type &&
      this.node.amount !== undefined &&
      this.node.amount !== null;
  }

  /**
   * Handles the save action
   * Closes the dialog with the updated node data if the form is valid
   */
  onConfirm(): void {
    // Get the current tree height
    const treeHeight = this.treeVisualizationService.getCurrentTreeHeight();
    console.log('Current tree height:', treeHeight);

    // If this is a new node and we're adding to a deep tree
    if (this.isNew && this.node.parentId) {
      // Get parent level from node
      const parentLevel = this.node.level ? (this.node.level - 1) : 0;
      console.log('Parent level:', parentLevel);

      // If parent is already at level 3 (which would make this node level 4)
      // or if adding to this parent would exceed total height of 4
      if (parentLevel >= 4 || treeHeight > 4) {
        alert('資料層數超過限制 無法新增子節點');
        return;
      }
    }

    if (this.isValid()) {
      this.ref.close({
        action: 'confirm',
        node: this.node
      });
    }
  }

  /**
   * Handles the cancel action
   * Closes the dialog without saving changes
   */
  onCancel(): void {
    this.ref.close({
      action: 'cancel'
    });
  }

  // Handle the node selection event from child component
  onNodeSelected(node: any): void {
    this.selectedNode = node;
    if (node){
      this.node = node;
    }
    console.log('Selected node in parent:', this.selectedNode);
    console.log(this.selectedNode===null);

    // Now you can use this.selectedNode for whatever you need
  }

}

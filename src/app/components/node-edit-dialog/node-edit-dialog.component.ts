import { Component, OnInit } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TreeNode } from '../../interfaces/interfaces';

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
    { label: '額度', value: '額度' },
    { label: '合控', value: '合控' }
  ];

  /**
   * Constructs a new NodeEditDialogComponent
   * @param {DynamicDialogRef} ref - Reference to the dialog
   * @param {DynamicDialogConfig} config - Configuration object containing dialog data
   */
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.node = { ...config.data.node };
    this.isNew = config.data.isNew;
    this.readOnly = config.data.readOnly;
  }

  ngOnInit(): void {
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
} 
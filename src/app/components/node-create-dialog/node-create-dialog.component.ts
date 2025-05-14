import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TreeNode} from '../../modules/tree-visualization/interfaces/interfaces';
import {TreeDataService} from '../../modules/tree-visualization/services/tree-data-service';

@Component({
  selector: 'app-node-create-dialog',
  templateUrl: './node-create-dialog.component.html',
  styleUrls: ['./node-create-dialog.component.scss']
})
export class NodeCreateDialogComponent implements OnInit {

  @Output() nodeSelected = new EventEmitter<any>();

  sourceData: TreeNode[] | undefined = [] as TreeNode[];
  selectedNodeKey: string | null = null;

  columns = [
    {field: 'name', header: '序號', align: 'right'},
    {field: 'currency', header: '幣別', align: 'right'},
    {field: 'amount', header: '金額', align: 'right'},
  ];

  constructor(private treeDataService: TreeDataService) {
  }

  ngOnInit(): void {
    if (this.treeDataService.getTreeData()?.children) {
      this.sourceData = this.treeDataService.getTreeData()?.children;
    }
  }


  isNodeSelected(rowNode: any): boolean {
    return this.selectedNodeKey === rowNode.node.id;
  }

  selectSingleNode(rowNode: any, event: MouseEvent): void {
    event.stopPropagation();
    this.isCheckboxesDisabled(rowNode);
    this.selectedNodeKey = rowNode.node.id;

    // Emit the selected node to parent component
    const selectedNode = this.getSelectedNode();
    this.nodeSelected.emit(selectedNode);
  }

  getSelectedNode(): any | null {
    if (!this.selectedNodeKey) {
      return null;
    }

    // Find the node with the matching ID
    const allNodes = this.getAllNodes();
    return allNodes.find(node => node.id === this.selectedNodeKey) || null;
  }

  getAllNodes(): any[] {
    const nodes: any[] = [];

    const traverseNodes = (node: any) => {
      if (node) {
        nodes.push(node);
      }
    };

    if (this.sourceData) {
      this.sourceData.forEach(node => traverseNodes(node));
    }
    return nodes;
  }

  isCheckboxesDisabled(rowNode: TreeNode): boolean {
    const selectedNode = this.treeDataService.getSelectedNode();
    const ids = this.treeDataService.getChildrenIds(selectedNode?.id);

    // 若為選取節點之子節點 或 其不為treetable顯示最上層節點 或 其為被選起節點之直系祖先 則不可選取
    if (ids.includes(rowNode.id) || !this.sourceData?.includes(rowNode)
      || this.treeDataService.isDescendant(rowNode, selectedNode?.id)
    ) {
      return true;
    }
    return false;
  }

}

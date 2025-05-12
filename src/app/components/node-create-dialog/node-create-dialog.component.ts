import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TreeNode} from '../../interfaces/interfaces';
import {TreeDataService} from '../../services/tree-data-service';

@Component({
  selector: 'app-node-create-dialog',
  templateUrl: './node-create-dialog.component.html',
  styleUrls: ['./node-create-dialog.component.scss']
})
export class NodeCreateDialogComponent implements OnInit {

  @Output() nodeSelected = new EventEmitter<any>();

  selectedNode?: TreeNode;
  selectedNodeKeys: Set<string> = new Set();


  sourceData: TreeNode[] | undefined = [{
    id: 'unique-1',
    name: '額度D',
    parentId: '1',
    level: 1,
    locked: false,
    selected: false,
    reports: [],
    type: '額度',
    currency: '新台幣',
    amount: 500000000, // 5億
    children: []
  },
    {
      id: 'unique-2',
      name: '合控C',
      parentId: '1',
      level: 1,
      locked: false,
      selected: false,
      reports: [],
      type: '合控',
      currency: '新台幣',
      amount: 150000000, // 1.5億
      children: [
        {
          id: 'unique-3',
          name: '額度E',
          parentId: '3',
          level: 2,
          locked: false,
          selected: false,
          reports: [],
          type: '額度',
          currency: '新台幣',
          amount: 200000000, // 2億
          children: []
        }
      ]
    }] as TreeNode[];

  columns = [
    {field: 'id', header: '序號', align: 'right'},
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

  // Track the currently selected node
  selectedNodeKey: string | null = null;

// Check if a node is selected
  isNodeSelected(rowNode: any): boolean {
    return this.selectedNodeKey === rowNode.node.id;
  }

// Select a single node
  selectSingleNode(rowNode: any, event: MouseEvent): void {
    event.stopPropagation();
    this.isCheckboxesDisabled(rowNode);
    this.selectedNodeKey = rowNode.node.id;

    // Emit the selected node to parent component
    const selectedNode = this.getSelectedNode();
    this.nodeSelected.emit(selectedNode);

  }

// Get the selected node (for your application logic)
  getSelectedNode(): any | null {
    if (!this.selectedNodeKey) {
      return null;
    }

    // Find the node with the matching ID
    const allNodes = this.getAllNodes();
    console.log(allNodes);
    return allNodes.find(node => node.id === this.selectedNodeKey) || null;
  }

// Helper function to get all nodes (as used in previous examples)
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
    console.log(ids);
    console.log(rowNode.id);
    if (ids.includes(rowNode.id)) {
      return true;
    }
    return false;
  }

}

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TreeNode} from '../../interfaces/interfaces';

@Component({
  selector: 'app-node-create-dialog',
  templateUrl: './node-create-dialog.component.html',
  styleUrls: ['./node-create-dialog.component.scss']
})
export class NodeCreateDialogComponent implements OnInit {

  @Output() nodeSelected = new EventEmitter<any>();

  selectedNode?: TreeNode;
  selectedNodeKeys: Set<string> = new Set();


  sourceData = [{
    id: 'unique-1',
    name: '額度D',
    position: '額度',
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
      position: '合控',
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
          position: '額度',
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

  constructor() {
  }

  ngOnInit(): void {
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
      if(node){
        nodes.push(node);
      }
    };

    this.sourceData.forEach(node => traverseNodes(node));
    return nodes;
  }

}

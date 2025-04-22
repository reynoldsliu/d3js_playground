import {Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import * as d3 from 'd3';
import {TreeNode} from '../../interfaces/interfaces';
import {TreeVisualizationService} from '../../services/tree-visualization-service';

@Component({
  selector: 'app-tree-visualization',
  templateUrl: './tree-visualization.component.html',
  styleUrls: ['./tree-visualization.component.scss']
})
export class TreeVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('treeContainer', {static: true}) public treeContainer!: ElementRef;
  private subscription: Subscription | undefined;

  data: TreeNode = {
    name: 'Eve',
    children: [
      {name: 'Cain'},
      {name: 'Seth', children: [{name: 'Enos'}, {name: 'Noam'}]},
      {name: 'Abel'},
      {name: 'Awan', children: [{name: 'Enoch'}]},
      {name: 'Azura'}
    ]
  };

  constructor(private treeVisualizationService: TreeVisualizationService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.refresh(this.data);
  }

  refresh(data: TreeNode): void {
    const initNode =
      this.treeVisualizationService.getInitNode(data);
    this.treeContainer.nativeElement.appendChild(initNode);
  }

  createNode(): void {
    console.log('createNode');
    const selectedNodes = this.treeVisualizationService.getSelectedNodes();
    console.log(selectedNodes);
    console.log(selectedNodes.length);
    console.log(selectedNodes[selectedNodes.length - 1]);
    // @ts-ignore
    console.log(selectedNodes[selectedNodes.length - 1].data.name);
    if (selectedNodes.length > 0
      && selectedNodes[selectedNodes.length - 1]
      // @ts-ignore
      && selectedNodes[selectedNodes.length - 1].data.name) {
      console.log('selected');
      // @ts-ignore
      const selectedNode = this.treeVisualizationService.findNode(selectedNodes[selectedNodes.length - 1].data.name);
      console.log(selectedNode);
      if (selectedNode) {
        console.log('creating');
        console.log(selectedNode.children);
        if (!selectedNode.children) {
          selectedNode.children = [];
        }
        console.log(selectedNode);
        selectedNode.children.push({
          id: '',
          name: '',
          data: '',
        // @ts-ignore
          parent: selectedNode,
        // @ts-ignore
          level: selectedNode.depth as number + 1,
        });
        console.log(selectedNode.children);

        console.log(this.treeVisualizationService.getRoot());
      }
    }
  }

  deleteNode(): void {
    console.log('deleteNode');
    const selectedNodes = this.treeVisualizationService.getSelectedNodes();
    this.treeVisualizationService.removeSelectedNodes(selectedNodes.map(e => e.id));
  }

  selectedNodes(): void {
    console.log(this.treeVisualizationService.getSelectedNodes());
  }

  resetView(): void {
    // Implement reset functionality if needed
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

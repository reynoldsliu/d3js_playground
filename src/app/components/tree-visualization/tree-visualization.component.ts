import {Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import * as d3 from 'd3';
import {TreeNode} from '../../interfaces/interfaces';
import {TreeVisualizationService} from '../../services/tree-visualization-service';
import {range} from 'd3';
import {TreeDataService} from '../../services/tree-data-service';

@Component({
  selector: 'app-tree-visualization',
  templateUrl: './tree-visualization.component.html',
  styleUrls: ['./tree-visualization.component.scss']
})
export class TreeVisualizationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('treeContainer', {static: true}) public treeContainer!: ElementRef;
  private subscription: Subscription | undefined;

  selectedNode: TreeNode | null = null;
  private zoom: any;
  private svg: any;
  public data: TreeNode | undefined;

  constructor(private treeVisualizationService: TreeVisualizationService,
              private treeDataService: TreeDataService,) {
  }

  ngOnInit(): void {
    this.treeDataService.selectedNode$.subscribe((selectedNode: TreeNode | null) => {
      this.selectedNode = selectedNode;
    });
    this.loadTreeData();
  }

  ngAfterViewInit(): void {
    this.refresh(this.data);
    this.treeVisualizationService.setupZoom();
  }

  loadTreeData(): void {
    this.data = this.treeVisualizationService.loadTreeData();
  }

  setupZoom(): void {
    this.zoom = d3.zoom()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        if (this.svg) {
          this.svg.select('g').attr('transform', event.transform);
        }
      });
  }

  applyZoom(): void {
    if (this.svg) {
      this.svg.call(this.zoom);
    }
  }

  zoomIn() {
    this.treeVisualizationService.zoomIn();
  }

  zoomOut() {
    this.treeVisualizationService.zoomOut();
  }

  resetZoom() {
    this.treeVisualizationService.resetZoom();
  }

  refresh(data: TreeNode | undefined): void {
    const initNode =
      this.treeVisualizationService.initializeTree(data);
    this.treeContainer.nativeElement.appendChild(initNode);
  }

  createNode(): void {
  }

  deleteNode(): void {
  }

  selectedNodes(): void {
  }

  editNode(): void {

  }

  resetView(): void {
    // Implement reset functionality if needed
  }

  ngOnDestroy(): void {
  }
}

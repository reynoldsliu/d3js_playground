import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {TreeDataService} from './tree-data-service';

@Injectable()
export class TreeZoomService {
    public zoom: any;
    private svg: any;
    private g: any;

    public svgWidth: number = 0;
    public svgHeight: number = 0;
    public nodeWidth: number = 0;
    public nodeHeight: number = 0;

    constructor(private treeDataService: TreeDataService,) {
    }

    setupZoom(svg: any, g: any): void {
        this.svg = svg;
        this.g = g;
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 2]) // 調整縮放比例範圍
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
                this.treeDataService.updateTreeState({
                    zoom: event.transform.k,
                    pan: {
                        x: event.transform.x,
                        y: event.transform.y
                    }
                });
            });

        // 將縮放行為套用到svg
        this.svg.call(this.zoom);
    }

    resetZoom(nodeWidth:number, nodeHeight:number, svgWidth:number, svgHeight:number): void {
        if (!this.svg || !this.g) {
            return;
        }
        this.nodeWidth = nodeWidth;
        this.nodeHeight = nodeHeight;
        this.svgWidth = svgWidth;
        this.svgHeight = svgHeight;

        // 取得所有節點邊界
        const bounds = this.g.node().getBBox();

        // 微調節點的實際大小和間距
        const padding = 50;
        const effectiveWidth = bounds.width + nodeWidth + padding * 2;
        const effectiveHeight = bounds.height + nodeHeight + padding * 2;

        // 設定縮放比例，確保所有節點可視
        const scale = Math.min(
            (svgWidth - padding * 2) / effectiveWidth,
            (svgHeight - padding * 2) / effectiveHeight,
            1.5
        );

        // 計算置中對齊位置，微調節點的實際大小
        const translateX = (svgWidth - effectiveWidth * scale) / 2 - (bounds.x - padding) * scale;
        const translateY = (svgHeight - effectiveHeight * scale) / 2 - (bounds.y - padding) * scale;

        const transform = d3.zoomIdentity
            .translate(translateX, translateY)
            .scale(scale);

        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }

    zoomIn(): void {
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, 1.1);
    }

    zoomOut(): void {
        this.svg.transition()
            .duration(300)
            .call(this.zoom.scaleBy, 0.9);
    }

}

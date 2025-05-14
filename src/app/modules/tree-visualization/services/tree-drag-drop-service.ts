import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {TreeNode} from '../interfaces/interfaces';
import * as d3 from 'd3';
import {TreeDataService} from './tree-data-service';

@Injectable()
export class TreeDragDropService {

    // 拖放相關屬性
    private draggedNode: any = null;
    private dragOverNode: any = null;
    private dragMode: 'reorder' | 'nest' = 'nest'; // 預設模式是放入目標節點下
    private _dragMode: 'reorder' | 'nest' = 'nest'; // 預設模式是放入目標節點下

    // 拖放完成事件
    private dragDropCompletedSubject = new Subject<{
        sourceId: string,
        targetId: string,
        mode: 'reorder' | 'nest'
    }>();
    public dragDropCompleted$ = this.dragDropCompletedSubject.asObservable();


    constructor(private treeDataService: TreeDataService) {
    }

    // 設置拖放模式的方法
    setDragMode(mode: 'reorder' | 'nest'): void {
        this._dragMode = mode;
    }

    // 拖動開始
    dragStarted(event: any, d: any): void {

        // 防止拖動根節點
        if (!d.parent) {
            return;
        }

        // 存儲被拖動的節點
        this.draggedNode = d;

        // 保存初始位置
        this.draggedNode.originalX = d.x;
        this.draggedNode.originalY = d.y;

        // 添加拖動樣式
        const nodeElement = event.sourceEvent.target.closest('.node');

        if (nodeElement) {
            d3.select(nodeElement)
                .classed('dragging', true)
                .raise();
        }

        event.sourceEvent.preventDefault();
        event.sourceEvent.stopPropagation();
    }

// 拖動過程
    dragging(event: any, d: any): void {
        if (!this.draggedNode) {
            return;
        }

        // 更新拖動節點位置
        const nodeElement = event.sourceEvent.target.closest('.node');
        if (nodeElement) {
            const dx = event.x - this.draggedNode.originalX;
            const dy = event.y - this.draggedNode.originalY;

            d3.select(nodeElement)
                .attr('transform', `translate(${this.draggedNode.x + dx}, ${this.draggedNode.y + dy})`);
        }

        // 清除所有突出顯示
        d3.selectAll('.node')
            .classed('drag-over-nest', false)
            .classed('drag-over-reorder', false);

        // 獲取當前鼠標坐標
        const mouseX = event.sourceEvent.clientX;
        const mouseY = event.sourceEvent.clientY;

        // 獲取所有節點並檢查哪個與鼠標位置最接近
        let closestNode = undefined;
        let minDistance = Infinity;

        // 獲取所有節點元素
        const allNodes = document.querySelectorAll('.node');

        allNodes.forEach(node => {
            if (node === nodeElement) {
                return;
            } // 跳過當前拖動的節點

            const rect = node.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 計算鼠標與節點中心的距離
            const distance = Math.sqrt(
                Math.pow(mouseX - centerX, 2) +
                Math.pow(mouseY - centerY, 2)
            );

            // 如果鼠標在節點區域內或者是最近的節點
            if (distance < minDistance) {
                minDistance = distance;
                closestNode = node;
            }
        });

        // 如果距離在閾值內，視為找到目標節點
        if (closestNode && minDistance < 50) { // 50px閾值，可調整

            const targetNodeId = (closestNode as TreeNode).id.replace('node-', '');
            const targetData = this.treeDataService.findNodeById(targetNodeId);

            if (targetData && targetData.id !== this.draggedNode.data.id) {
                console.log('Valid target node:', targetData);
                this.dragOverNode = targetData;

                // 判斷拖放模式
                // 使用設置的模式而不是檢測 Alt 鍵
                this.dragMode = this._dragMode;
                console.log('Using drag mode:', this.dragMode);

                // 根據模式添加不同的視覺提示
                if (this.dragOverNode) {
                    // 根據模式設置突出顯示樣式
                    d3.select(closestNode).classed(
                        this.dragMode === 'reorder' ? 'drag-over-reorder' : 'drag-over-nest',
                        true
                    );
                }

            }
        } else {
            this.dragOverNode = null;
        }
    }

// 拖動結束
    dragEnded(event: any, d: any): void {
        if (!this.draggedNode) {
            return;
        }

        // 移除拖動樣式
        d3.selectAll('.node')
            .classed('dragging', false)
            .classed('drag-over-nest', false)
            .classed('drag-over-reorder', false);

        // 處理節點移動
        if (this.dragOverNode) {

            // 根據不同模式觸發不同的操作
            if (this.dragMode === 'reorder') {
                // 模式1: 互換節點
                console.log('Emitting swap nodes event:', {
                    sourceId: this.draggedNode.data.id,
                    targetId: this.dragOverNode.id
                });

                this.dragDropCompletedSubject.next({
                    sourceId: this.draggedNode.data.id,
                    targetId: this.dragOverNode.id,
                    mode: 'reorder'
                });
            } else {
                // 模式2: 將節點作為子節點添加
                console.log('Emitting nest node event:', {
                    sourceId: this.draggedNode.data.id,
                    targetId: this.dragOverNode.id
                });

                this.dragDropCompletedSubject.next({
                    sourceId: this.draggedNode.data.id,
                    targetId: this.dragOverNode.id,
                    mode: 'nest'
                });
            }
        } else {
            console.log('No target node, resetting position');

            // 恢復原始位置
            const nodeElement = event.sourceEvent.target.closest('.node');
            if (nodeElement) {
                d3.select(nodeElement)
                    .attr('transform', `translate(${this.draggedNode.originalX}, ${this.draggedNode.originalY})`);
            }
        }

        // 清空拖動狀態
        this.draggedNode = null;
        this.dragOverNode = null;
    }
}

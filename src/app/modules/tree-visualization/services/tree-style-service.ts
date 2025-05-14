import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {TreeDataService} from './tree-data-service';
import {TreeNode} from '../interfaces/interfaces';
import {BehaviorSubject, Subject} from 'rxjs';

/**
 * Style configuration interface
 */
export interface TreeStyleConfig {
    node: {
        default: {
            fill: string;
            stroke: string;
            strokeWidth: string;
        };
        selected: {
            fill: string;
            stroke: string;
            strokeWidth: string;
        };
        similar: {
            stroke: string;
            strokeWidth: string;
            strokeDash: string;
        };
        credit: {
            fill: string;
            stroke: string;
            strokeWidth: string;
        };
        control: {
            fill: string;
            stroke: string;
            strokeWidth: string;
        };
        company: {
            fill: string;
            stroke: string;
            strokeWidth: string;
        };
    };
    link: {
        stroke: string;
        strokeWidth: string;
        opacity: number;
    };
    text: {
        title: {
            size: string;
            color: string;
        };
        info: {
            size: string;
            color: string;
        };
    };
    tooltip: {
        icon: {
            size: string;
            color: string;
        };
        background: string;
        border: string;
    };
}

/**
 * Style update event interface
 */
export interface StyleUpdateEvent {
    type: 'nodeSelected' | 'nodeHighlight' | 'styleChange' | 'reset';
    nodeId?: string;
    nodeName?: string;
    similarNodes?: TreeNode[];
    customStyles?: Partial<TreeStyleConfig>;
}

@Injectable({
    providedIn: 'root'
})
export class TreeStyleService {
    // Default style configuration
    private stylesSubject = new BehaviorSubject<TreeStyleConfig>({
        node: {
            default: {
                fill: '#e8f5e9',
                stroke: '#81c784',
                strokeWidth: '1px'
            },
            selected: {
                fill: '#d4e6f7',
                stroke: '#3498db',
                strokeWidth: '2px'
            },
            similar: {
                stroke: '#f39c12',
                strokeWidth: '2px',
                strokeDash: '5,3'
            },
            credit: { // 額度樣式
                fill: '#e3f2fd',
                stroke: '#64b5f6',
                strokeWidth: '1px'
            },
            control: { // 合控樣式
                fill: '#f3e5f5',
                stroke: '#ba68c8',
                strokeWidth: '1px'
            },
            company: { // 公司（根節點）樣式
                fill: '#e8f5e9',
                stroke: '#2e7d32',
                strokeWidth: '2px'
            }
        },
        link: {
            stroke: '#ccc',
            strokeWidth: '1px',
            opacity: 1
        },
        text: {
            title: {
                size: '14px',
                color: '#333'
            },
            info: {
                size: '12px',
                color: '#666'
            }
        },
        tooltip: {
            icon: {
                size: '16px',
                color: '#666'
            },
            background: '#fff',
            border: '#ccc'
        }
    });

    // Observable for style changes
    public styles$ = this.stylesSubject.asObservable();

    // Style update event stream
    private styleUpdateSubject = new Subject<StyleUpdateEvent>();
    public styleUpdate$ = this.styleUpdateSubject.asObservable();

    constructor(private treeDataService: TreeDataService) {
    }

    /**
     * Get current styles configuration
     */
    get styles(): TreeStyleConfig {
        return this.stylesSubject.getValue();
    }

    /**
     * Update styles configuration
     * @param newStyles Partial style configuration to apply
     */
    updateStyles(newStyles: Partial<TreeStyleConfig>): void {
        const currentStyles = this.stylesSubject.getValue();
        const updatedStyles = this.deepMerge(currentStyles, newStyles);
        this.stylesSubject.next(updatedStyles);

        // Emit style change event
        this.styleUpdateSubject.next({
            type: 'styleChange',
            customStyles: newStyles
        });
    }

    /**
     * Handle node selection style update
     * @param nodeId ID of selected node
     * @param nodeName Name of selected node
     */
    selectNode(nodeId: string, nodeName: string): void {
        this.styleUpdateSubject.next({
            type: 'nodeSelected',
            nodeId,
            nodeName
        });
    }

    /**
     * Update node styles based on selection
     * @param nodes D3 selection of nodes
     * @param selectedNodeId ID of selected node
     * @param nodeName Name of selected node
     */
    updateNodeStyles(nodes: any, selectedNodeId: string, nodeName: string): void {
        const currentStyles = this.styles;

        // Reset all node styles
        nodes.select('rect')
            .style('stroke', (d: any) => {
                const nodeData = d.data as TreeNode;
                if (nodeData.level === 0) {
                    return currentStyles.node.company.stroke;
                }
                if (nodeData.type === '額度') {
                    return currentStyles.node.credit.stroke;
                }
                if (nodeData.type === '合控') {
                    return currentStyles.node.control.stroke;
                }
                return currentStyles.node.default.stroke;
            })
            .style('stroke-width', (d: any) => {
                const nodeData = d.data as TreeNode;
                if (nodeData.level === 0) {
                    return currentStyles.node.company.strokeWidth;
                }
                if (nodeData.type === '額度') {
                    return currentStyles.node.credit.strokeWidth;
                }
                if (nodeData.type === '合控') {
                    return currentStyles.node.control.strokeWidth;
                }
                return currentStyles.node.default.strokeWidth;
            })
            .style('stroke-dasharray', null);

        // Set selected node style
        const nodeElement = d3.select(`#node-${selectedNodeId}`).select('rect');
        if (!nodeElement.empty()) {
            nodeElement
                .style('stroke', currentStyles.node.selected.stroke)
                .style('stroke-width', currentStyles.node.selected.strokeWidth);
        }

        // Find and highlight similar nodes if needed
        const similarNodes = this.treeDataService.findNodesByName?.(nodeName);
        if (similarNodes && similarNodes.length > 0) {
            this.styleUpdateSubject.next({
                type: 'nodeHighlight',
                nodeId: selectedNodeId,
                similarNodes
            });
        }
    }

    /**
     * Reset all node styles to default
     * @param nodes D3 selection of nodes
     */
    resetAllNodeStyles(nodes: any): void {
        // Reset all nodes to default style
        nodes.select('rect')
            .style('fill', '#69b3a2')
            .style('stroke', '#000')
            .style('stroke-width', '1px')
            .style('stroke-dasharray', null);

        // Reapply selected node style if any
        const selectedNodeId = this.treeDataService.getSelectedNodeId();
        if (selectedNodeId) {
            d3.select(`#node-${selectedNodeId}`).select('rect')
                .style('fill', '#d4e6f7')
                .style('stroke', '#3498db')
                .style('stroke-width', '3px');
        }

        // Emit reset event
        this.styleUpdateSubject.next({
            type: 'reset'
        });
    }

    /**
     * Highlight only the selected node without updating all nodes
     */
    highlightSelectedNode(nodes: any, nodeId: string): void {
        // Clear previous selection highlight
        nodes.select('rect')
            .style('stroke-dasharray', null)
            .filter((d: any) => d.data.selected)
            .style('stroke', (d: any) => {
                const nodeData = d.data as TreeNode;
                return this.getNodeStroke(nodeData);
            })
            .style('stroke-width', (d: any) => {
                const nodeData = d.data as TreeNode;
                return this.getNodeStrokeWidth(nodeData);
            });

        // Apply selected style to the selected node
        const nodeElement = d3.select(`#node-${nodeId}`).select('rect');
        if (!nodeElement.empty()) {
            nodeElement
                .style('stroke', this.styles.node.selected.stroke)
                .style('stroke-width', this.styles.node.selected.strokeWidth);
        }
    }

    handleStyleUpdateEvent(event: StyleUpdateEvent, nodes: any) {
        switch (event.type) {
            case 'nodeSelected':
                if (event.nodeId && event.nodeName) {
                    // Just update the selected node without updating all nodes
                    this.highlightSelectedNode(nodes, event.nodeId);
                }
                break;

            case 'nodeHighlight':
                if (event.nodeId && event.similarNodes) {
                    // Just highlight the similar nodes
                    this.highlightSimilarNodes(event.similarNodes, event.nodeId);
                }
                break;

            case 'styleChange':
                // This is already handled by the styles$ subscription
                // which will call updateAllStyles()
                break;

            case 'reset':
                // Reset all node styles
                this.resetAllNodeStyles(nodes);
                break;
        }
    }

    /**
     * Highlight similar nodes
     * @param similarNodes Array of similar nodes to highlight
     * @param currentNodeId ID of current node (to exclude from highlighting)
     * @param nodeStyle Optional custom node style
     */
    highlightSimilarNodes(similarNodes: TreeNode[], currentNodeId: string, nodeStyle?: any): void {
        if (!nodeStyle) {
            nodeStyle = this.styles.node;
        }

        if (!similarNodes || similarNodes.length === 0) {
            return;
        }

        const nodesToHighlight = similarNodes.filter(node => node.id !== currentNodeId);
        nodesToHighlight.forEach(node => {
            if (node.id) {
                const nodeElement = d3.select(`#node-${node.id}`).select('rect');
                if (!nodeElement.empty()) {
                    nodeElement
                        .style('stroke', nodeStyle.similar.stroke)
                        .style('stroke-width', nodeStyle.similar.strokeWidth)
                        .style('stroke-dasharray', nodeStyle.similar.strokeDash);
                }
            }
        });
    }

    updateLinkStyle(links: any) {
        return links
            .style('stroke', this.styles.link.stroke)
            .style('stroke-width', this.styles.link.strokeWidth)
            .style('opacity', this.styles.link.opacity);
    }

    updateNodeRect(rect: any) {
        rect
            .style('fill', (d: any) => {
                const nodeData = d.data as TreeNode;
                if (nodeData.level === 0) {
                    return this.styles.node.company.fill;
                }
                if (nodeData.type === '額度') {
                    return this.styles.node.credit.fill;
                }
                if (nodeData.type === '合控') {
                    return this.styles.node.control.fill;
                }
                return this.styles.node.default.fill;
            })
            .style('stroke', (d: any) => {
                // ... similar logic for stroke color
            })
            .style('stroke-width', (d: any) => {
                // ... similar logic for stroke width
            });
    }

    updateTitleStyle(title: any) {
        title
            .style('font-size', this.styles.text.title.size)
            .style('fill', this.styles.text.title.color);
    }

    updateInfoStyle(info: any) {
        info
            .style('font-size', this.styles.text.info.size)
            .style('fill', this.styles.text.info.color);
    }

    /**
     * Get appropriate node fill color
     * @param node Tree node data
     */
    getNodeFill(node: TreeNode): string {
        const currentStyles = this.styles;

        if (node.level === 0) {
            return currentStyles.node.company.fill;
        }
        if (node.type === '額度') {
            return currentStyles.node.credit.fill;
        }
        if (node.type === '合控') {
            return currentStyles.node.control.fill;
        }
        return currentStyles.node.default.fill;
    }

    /**
     * Get appropriate node stroke color
     * @param node Tree node data
     * @param isSelected Whether node is selected
     */
    getNodeStroke(node: TreeNode, isSelected: boolean = false): string {
        const currentStyles = this.styles;

        if (isSelected) {
            return currentStyles.node.selected.stroke;
        }
        if (node.level === 0) {
            return currentStyles.node.company.stroke;
        }
        if (node.type === '額度') {
            return currentStyles.node.credit.stroke;
        }
        if (node.type === '合控') {
            return currentStyles.node.control.stroke;
        }
        return currentStyles.node.default.stroke;
    }

    /**
     * Get appropriate node stroke width
     * @param node Tree node data
     * @param isSelected Whether node is selected
     */
    getNodeStrokeWidth(node: TreeNode, isSelected: boolean = false): string {
        const currentStyles = this.styles;

        if (isSelected) {
            return currentStyles.node.selected.strokeWidth;
        }
        if (node.level === 0) {
            return currentStyles.node.company.strokeWidth;
        }
        if (node.type === '額度') {
            return currentStyles.node.credit.strokeWidth;
        }
        if (node.type === '合控') {
            return currentStyles.node.control.strokeWidth;
        }
        return currentStyles.node.default.strokeWidth;
    }

    /**
     * Deep merge objects (helper function)
     * @param target Target object
     * @param source Source object to merge in
     */
    private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
        const output = {...target};

        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                const sourceKey = key as keyof Partial<T>;
                if (isObject(source[sourceKey])) {
                    if (!(key in target)) {
                        Object.assign(output, {[key]: source[sourceKey]});
                    } else {
                        const targetKey = key as keyof T;
                        output[targetKey] = this.deepMerge(
                            target[targetKey] as Record<string, any>,
                            source[sourceKey] as Record<string, any>
                        ) as any;
                    }
                } else {
                    Object.assign(output, {[key]: source[sourceKey]});
                }
            });
        }

        return output;
    }
}

/**
 * Check if value is an object
 * @param item Value to check
 */
function isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
}

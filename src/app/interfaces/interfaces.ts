import {CompanyBlockComponent} from '../components/company-block/company-block.component';

export interface TreeNode {
  id?: string;
  name: string;
  data?: string;
  parentId?: string;
  level?: number;
  children?: TreeNode[];
  component?: CompanyBlockComponent;
  metaData?:{
    [key: string]: any;
  }
}

export interface TreeConfig {
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
}

export interface TreeState {
  selectedNodes: TreeNode[];
  highlightNodes: TreeNode[];
}

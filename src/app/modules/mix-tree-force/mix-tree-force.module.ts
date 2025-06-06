import {NgModule} from '@angular/core';
import {MixTreeForceComponent} from '../../components/mix-tree-force/mix-tree-force.component';
import {TreeVisualizationModule} from '../tree-visualization/tree-visualization.module';
import {ForceDirectedTreeModule} from '../force-directed-tree/force-directed-tree.module';
import {MixTreeForceService} from "./services/mix-tree-force.service";

@NgModule({
  declarations: [MixTreeForceComponent],
  imports: [
    ForceDirectedTreeModule,
    TreeVisualizationModule
  ],
  exports: [MixTreeForceComponent,
  ],
  providers: [MixTreeForceService]
})
export class MixTreeForceModule { }

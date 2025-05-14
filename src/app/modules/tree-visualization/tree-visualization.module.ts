import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';

// Components
import { TreeVisualizationComponent } from '../../components/tree-visualization/tree-visualization.component';

// Services
import { TreeVisualizationService } from './services/tree-visualization-service';
import { TreeDataService } from './services/tree-data-service';
import {NodeCreateDialogComponent} from '../../components/node-create-dialog/node-create-dialog.component';
import {TreeTableModule} from 'primeng/treetable';
import {NodeEditDialogComponent} from '../../components/node-edit-dialog/node-edit-dialog.component';
import {TableModule} from 'primeng/table';
import {TreeDragDropService} from './services/tree-drag-drop-service';
import {TreeZoomService} from './services/tree-zoom-service';
import {TreeTooltipService} from './services/tree-tooltip-service';
import {TreeStyleService} from './services/tree-style-service';

/**
 * TreeVisualizationModule is responsible for managing all components, services,
 * and dependencies related to the tree visualization functionality.
 *
 * @NgModule Defines the module with its imports, declarations, exports, and providers.
 */
@NgModule({
  declarations: [
    TreeVisualizationComponent,
    NodeEditDialogComponent,
    NodeCreateDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    // PrimeNG Modules
    DialogModule,
    DynamicDialogModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextareaModule,
    TreeTableModule,
    TableModule
  ],
  exports: [
    TreeVisualizationComponent
  ],
  providers: [
    TreeVisualizationService,
    TreeDataService,
    TreeDragDropService,
    TreeZoomService,
    TreeTooltipService,
    TreeStyleService
  ]
})
export class TreeVisualizationModule { }

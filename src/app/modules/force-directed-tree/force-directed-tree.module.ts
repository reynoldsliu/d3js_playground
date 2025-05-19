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

import {TreeTableModule} from 'primeng/treetable';
import {TableModule} from 'primeng/table';
import {ForceDirectedTreeComponent} from '../../components/force-directed-tree/force-directed-tree.component';

/**
 * TreeVisualizationModule is responsible for managing all components, services,
 * and dependencies related to the tree visualization functionality.
 *
 * @NgModule Defines the module with its imports, declarations, exports, and providers.
 */
@NgModule({
  declarations: [
    ForceDirectedTreeComponent
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
    ForceDirectedTreeComponent
  ],
})
export class ForceDirectedTreeModule { }

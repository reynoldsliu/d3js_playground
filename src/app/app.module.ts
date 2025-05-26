import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {TreeVisualizationService} from './modules/tree-visualization/services/tree-visualization-service';
import {TreeDataService} from './modules/tree-visualization/services/tree-data-service';

// 導入樹狀視覺化模組
import { TreeVisualizationModule } from './modules/tree-visualization/tree-visualization.module';
import {ForceDirectedTreeModule} from './modules/force-directed-tree/force-directed-tree.module';
import {RadioButtonModule} from 'primeng/radiobutton';
import {MixTreeForceModule} from './modules/mix-tree-force/mix-tree-force.module';
import {ClusterForceTreeModule} from "./modules/cluster-force-tree/cluster-force-tree.module";

/**
 * 應用程式根模組
 * 負責匯入所有必要的模組並聲明應用程式的主要組件
 */
@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        // PrimeNG Modules
        DialogModule,
        DynamicDialogModule,
        InputTextModule,
        ButtonModule,
        DropdownModule,
        InputNumberModule,
        AppRoutingModule,
        RadioButtonModule,
        TreeVisualizationModule,
        ForceDirectedTreeModule,
        MixTreeForceModule,
        ClusterForceTreeModule,
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }

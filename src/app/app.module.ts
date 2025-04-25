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
import { TooltipModule } from 'primeng/tooltip';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeVisualizationComponent } from './components/tree-visualization/tree-visualization.component';
import {TreeVisualizationService} from './services/tree-visualization-service';
import {CompanyBlockComponent} from './components/company-block/company-block.component';
import {TreeDataService} from './services/tree-data-service';
import { NodeEditDialogComponent } from './components/node-edit-dialog/node-edit-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    TreeVisualizationComponent,
    CompanyBlockComponent,
    NodeEditDialogComponent
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
    AppRoutingModule
  ],
  providers: [TreeVisualizationService,
  TreeDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }

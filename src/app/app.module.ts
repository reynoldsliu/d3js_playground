import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeVisualizationComponent } from './components/tree-visualization/tree-visualization.component';
import {TreeVisualizationService} from './services/tree-visualization-service';
import {CompanyBlockComponent} from './components/company-block/company-block.component';

@NgModule({
  declarations: [
    AppComponent,
    TreeVisualizationComponent,
    CompanyBlockComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [TreeVisualizationService],
  bootstrap: [AppComponent]
})
export class AppModule { }

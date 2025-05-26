import {NgModule} from "@angular/core";
import {ForceDirectedTreeComponent} from "../../components/force-directed-tree/force-directed-tree.component";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {DialogModule} from "primeng/dialog";
import {DynamicDialogModule} from "primeng/dynamicdialog";
import {InputTextModule} from "primeng/inputtext";
import {ButtonModule} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {InputNumberModule} from "primeng/inputnumber";
import {InputTextareaModule} from "primeng/inputtextarea";
import {TreeTableModule} from "primeng/treetable";
import {TableModule} from "primeng/table";
import {ClusterForceTreeComponent} from "./components/cluster-force-tree/cluster-force-tree.component";

@NgModule({
  declarations: [
    ClusterForceTreeComponent
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
    ClusterForceTreeComponent
  ],
})
export class ClusterForceTreeModule { }

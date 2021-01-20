import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DataTableComponent} from './components/table/table.component';
import {DataTablePaginationComponent} from './components/pagination/pagination.component';
import {DataTableRowComponent} from './components/row/row.component';
import {DataTableTitleComponent} from './components/title/title.component';
import {DataTableColumnDirective} from './directives/column.directive';
import {DataTableTitleDirective} from './directives/title.directive';
import {MinPipe} from './filters/min.pipe';
import {PxPipe} from './filters/px.pipe';

export * from './models';
export * from './utils/data-table-resource';
export {DataTableComponent, DataTablePaginationComponent, DataTableRowComponent, DataTableColumnDirective, DataTableTitleDirective};


@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    DataTablePaginationComponent,
    DataTableRowComponent,
    DataTableComponent,
    DataTableTitleComponent,
    DataTableColumnDirective,
    DataTableTitleDirective,
    MinPipe,
    PxPipe,
  ],
  exports: [
    DataTableComponent,
    DataTableRowComponent,
    DataTableColumnDirective,
    DataTableTitleComponent,
    DataTablePaginationComponent,
    DataTableTitleDirective
  ]
})
export class DataTableModule {
}

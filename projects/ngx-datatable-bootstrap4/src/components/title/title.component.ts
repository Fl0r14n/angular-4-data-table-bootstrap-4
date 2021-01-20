import {Component, forwardRef, HostListener, Inject, Input} from '@angular/core';
import {DataTableComponent} from '../table/table.component';
import {DataTableTitleDirective} from '../../directives/title.directive';

@Component({
  selector: 'data-table-title',
  templateUrl: 'title.component.html',
  styleUrls: ['title.component.scss']
})
export class DataTableTitleComponent<T> {

  columnSelectorOpen = false;

  @Input()
  title: DataTableTitleDirective;

  constructor(@Inject(forwardRef(() => DataTableComponent)) public dataTable: DataTableComponent<T>) {
  }

  @HostListener('document:click')
  closeSelector(): void {
    this.columnSelectorOpen = false;
  }
}


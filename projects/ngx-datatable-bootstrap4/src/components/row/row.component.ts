import {Component, EventEmitter, forwardRef, Inject, Input, OnDestroy, Output} from '@angular/core';
import {DataTableColumn, DataTableRow} from '../../models';
import {DataTableComponent} from '../table/table.component';

@Component({
  selector: '[dataTableRow]',
  templateUrl: 'row.component.html',
  styleUrls: ['row.component.scss']
})
export class DataTableRowComponent<T> implements DataTableRow<T>, OnDestroy {

  // tslint:disable-next-line:variable-name
  private _selected = false;
  expanded = false;

  @Input()
  item: T;
  @Input()
  index: number;

  @Output()
  selectedChange = new EventEmitter();

  // FIXME is there no template keyword for this in angular 2?
  public _this = this;

  constructor(@Inject(forwardRef(() => DataTableComponent)) public dataTable: DataTableComponent<T>) {
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected) {
    this._selected = selected;
    this.selectedChange.emit(selected);
  }

  // other:
  get displayIndex(): number {
    if (this.dataTable.pagination) {
      return this.dataTable.displayParams.offset + this.index + 1;
    } else {
      return this.index + 1;
    }
  }

  getTooltip(): string {
    if (this.dataTable.rowTooltip) {
      return this.dataTable.rowTooltip(this);
    }
    return '';
  }

  populateCell(column: DataTableColumn<T>): DataTableColumn<T> {
    column.item = this.item;
    column.index = this.index;
    column.selected = this.selected;
    return column;
  }

  ngOnDestroy(): void {
    this.selected = false;
  }
}

import {
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  forwardRef,
  Input, OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import {drag} from '../../utils/drag';
import {
  DataTableCellEvent,
  DataTableColumn,
  DataTableHeaderEvent,
  DataTableParams,
  DataTableRow,
  DataTableRowEvent,
  DataTableTranslations,
  defaultTranslations,
  RowCallback
} from '../../models';
import {DataTableColumnDirective} from '../../directives/column.directive';
import {DataTableRowComponent} from '../row/row.component';
import {DataTableTitleDirective} from '../../directives/title.directive';
import {Subscription} from 'rxjs';


@Component({
  selector: 'data-table',
  templateUrl: 'table.component.html',
  styleUrls: ['table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DataTableComponent<T> implements OnInit, OnDestroy {

  // UI state without input:
  indexColumnVisible: boolean;
  selectColumnVisible: boolean;
  expandColumnVisible: boolean;

  // UI state: visible ge/set for the outside with @Input for one-time initial values
  private _sortBy: string;
  private _sortAsc = true;
  private _offset = 0;
  private _limit = 10;
  private _items: T[] = [];
  private _scheduledReload: number = null;
  private _selectAllCheckbox = false;
  private _reloading = false;
  private _resizeInProgress = false;
  private subscription = new Subscription();

  selectedRow: DataTableRow<T>;
  selectedRows: DataTableRow<T>[] = [];
  resizeLimit = 30;

  @Input()
  itemCount: number;
  @Input()
  pagination = true;
  @Input()
  indexColumn = true;
  @Input()
  indexColumnHeader = '';
  @Input()
  rowColors: RowCallback<T>;
  @Input()
  rowTooltip: RowCallback<T>;
  @Input()
  selectColumn = false;
  @Input()
  multiSelect = true;
  @Input()
  substituteRows = true;
  @Input()
  expandableRows = false;
  @Input()
  translations: DataTableTranslations = defaultTranslations;
  @Input()
  selectOnRowClick = false;
  @Input()
  autoReload = true;
  @Input()
  showReloading = false;

  // event handlers:
  @Output()
  rowClick: EventEmitter<DataTableRowEvent<T>> = new EventEmitter();
  @Output()
  rowExpand: EventEmitter<DataTableRowEvent<T>> = new EventEmitter();
  @Output()
  rowDoubleClick: EventEmitter<DataTableRowEvent<T>> = new EventEmitter();
  @Output()
  headerClick: EventEmitter<DataTableHeaderEvent<T>> = new EventEmitter();
  @Output()
  cellClick: EventEmitter<DataTableCellEvent<T>> = new EventEmitter();
  @Output()
  reload: EventEmitter<DataTableParams> = new EventEmitter();

  // UI components:
  @ContentChild(forwardRef(() => DataTableTitleDirective))
  title: DataTableTitleDirective;
  @ContentChildren(DataTableColumnDirective)
  columns: QueryList<DataTableColumnDirective<T>>;
  @ViewChildren(DataTableRowComponent)
  rows: QueryList<DataTableRowComponent<T>>;
  @ContentChild('expandTemplate')
  expandTemplate: TemplateRef<any>;

  @Input()
  get items(): T[] {
    return this._items;
  }

  set items(items: T[]) {
    this._items = items;
    this.onReloadFinished();
  }

  @Input()
  get sortBy(): string {
    return this._sortBy;
  }

  set sortBy(value: string) {
    this._sortBy = value;
    this.triggerReload();
  }

  @Input()
  get sortAsc(): boolean {
    return this._sortAsc;
  }

  set sortAsc(value: boolean) {
    this._sortAsc = value;
    this.triggerReload();
  }

  @Input()
  get offset(): number {
    return this._offset;
  }

  set offset(value: number) {
    this._offset = value;
    this.triggerReload();
  }

  @Input()
  get limit(): number {
    return this._limit;
  }

  set limit(value: number) {
    this._limit = value;
    this.triggerReload();
  }

  // calculated property:
  @Input()
  get page(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  set page(value: number) {
    this.offset = (value - 1) * this.limit;
  }

  get lastPage(): number {
    return Math.ceil(this.itemCount / this.limit);
  }

  get reloading(): boolean {
    return this._reloading;
  }

  get displayParams(): DataTableParams {
    return {
      sortBy: this.sortBy,
      sortAsc: this.sortAsc,
      offset: this.offset,
      limit: this.limit
    };
  }

  get selectAllCheckbox(): boolean {
    return this._selectAllCheckbox;
  }

  set selectAllCheckbox(value: boolean) {
    this._selectAllCheckbox = value;
    this.onSelectAllChanged(value);
  }

  get columnCount(): number {
    let count = 0;
    count += this.indexColumnVisible ? 1 : 0;
    count += this.selectColumnVisible ? 1 : 0;
    count += this.expandColumnVisible ? 1 : 0;
    this.columns.toArray().forEach(column => {
      count += column.visible ? 1 : 0;
    });
    return count;
  }

  get substituteItems(): any[] {
    return Array.from({length: this.displayParams.limit - this.items.length});
  }

  getRowColor(row: DataTableRow<T>): string {
    if (this.rowColors !== undefined) {
      return this.rowColors(row);
    }
  }

  // setting multiple observable properties simultaneously
  sort(sortBy: string, asc: boolean): void {
    this.sortBy = sortBy;
    this.sortAsc = asc;
  }

  reloadItems(): void {
    this._reloading = true;
    this.reload.emit(this._getRemoteParameters());
  }

  rowClicked(row: DataTableRow<T>, event: MouseEvent): void {
    this.rowClick.emit({row, event});
  }

  rowDoubleClicked(row: DataTableRow<T>, event: MouseEvent): void {
    this.rowDoubleClick.emit({row, event});
  }

  headerClicked(column: DataTableColumn<T>, event: MouseEvent): void {
    if (!this._resizeInProgress) {
      this.headerClick.emit({column, event});
    } else {
      // this is because I can't prevent click from mouseup of the drag end
      this._resizeInProgress = false;
    }
  }

  cellClicked(cell: DataTableColumn<T>, event: MouseEvent): void {
    this.cellClick.emit({cell, event});
  }

  rowExpanded(row: DataTableRow<T>, event: MouseEvent): void {
    this.rowExpand.emit({row, event});
  }

  onRowSelectChanged(row: DataTableRow<T>): void {
    // maintain the selectedRow(s) view
    if (this.multiSelect) {
      const index = this.selectedRows.indexOf(row);
      if (row.selected && index < 0) {
        this.selectedRows.push(row);
      } else if (!row.selected && index >= 0) {
        this.selectedRows.splice(index, 1);
      }
    } else {
      if (row.selected) {
        this.selectedRow = row;
      } else if (this.selectedRow === row) {
        this.selectedRow = undefined;
      }
    }
    // unselect all other rows:
    if (row.selected && !this.multiSelect) {
      this.rows.filter(r => r.selected).forEach(r => {
        if (r !== row) { // avoid endless loop
          r.selected = false;
        }
      });
    }
  }

  resizeColumnStart(event: MouseEvent, column: DataTableColumn<T>, columnElement: HTMLElement): void {
    this._resizeInProgress = true;
    drag(event, {
      move: (moveEvent: MouseEvent, dx: number) => {
        if (this.isResizeInLimit(columnElement, dx)) {
          column.width = columnElement.offsetWidth + dx;
        }
      },
    });
  }

  ngOnInit(): void {
    this.indexColumnVisible = this.indexColumn;
    this.selectColumnVisible = this.selectColumn;
    this.expandColumnVisible = this.expandableRows;
    this.subscription.add(this.headerClick.subscribe(tableEvent => this.sortColumn(tableEvent.column)));
    if (this.selectOnRowClick) {
      this.subscription.add(this.rowClick.subscribe(tableEvent => tableEvent.row.selected = !tableEvent.row.selected));
    }
    if (this.autoReload && this._scheduledReload == null) {
      this.reloadItems();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscription = undefined;
  }

  private onReloadFinished(): void {
    this._selectAllCheckbox = false;
    this._reloading = false;
  }

  private triggerReload(): void {
    // for avoiding cascading reloads if multiple params are set at once:
    if (this._scheduledReload) {
      clearTimeout(this._scheduledReload);
    }
    this._scheduledReload = setTimeout(() => {
      this.reloadItems();
    });
  }

  private _getRemoteParameters(): DataTableParams {
    const params: DataTableParams = {};
    if (this.sortBy) {
      params.sortBy = this.sortBy;
      params.sortAsc = this.sortAsc;
    }
    if (this.pagination) {
      params.offset = this.offset;
      params.limit = this.limit;
    }
    return params;
  }

  private sortColumn(column: DataTableColumn<T>): void {
    if (column.sortable) {
      const ascending = this.sortBy === column.property ? !this.sortAsc : true;
      this.sort(column.property, ascending);
    }
  }

  private onSelectAllChanged(value: boolean): void {
    this.rows.toArray().forEach(row => row.selected = value);
  }

  private isResizeInLimit(columnElement: HTMLElement, dx: number): boolean {
    /* This is needed because CSS min-width didn't work on table-layout: fixed.
     Without the limits, resizing can make the next column disappear completely,
     and even increase the table width. The current implementation suffers from the fact,
     that offsetWidth sometimes contains out-of-date values. */
    return !((dx < 0 && (columnElement.offsetWidth + dx) <= this.resizeLimit) ||
      !columnElement.nextElementSibling || // resizing doesn't make sense for the last visible column
      (dx >= 0 && ((columnElement.nextElementSibling as HTMLElement).offsetWidth + dx) <= this.resizeLimit));
  }
}

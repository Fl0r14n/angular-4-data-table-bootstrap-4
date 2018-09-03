import {
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChildren
} from '@angular/core';
import { DataTableColumn, DataTableRow, DataTableTitle } from '../../';
import { drag } from '../../utils/drag';
import {
  DataTableCellEvent,
  DataTableHeaderEvent,
  DataTableParams,
  DataTableRowEvent,
  DataTableTranslations,
  defaultTranslations,
  RowCallback
} from '../types';
import { Array } from 'core-js';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'data-table',
  templateUrl: 'table.component.html',
  styleUrls: ['table.component.scss']
})
export class DataTable<T> implements DataTableParams, OnInit {

  _rowChangeObserver: any;
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
  private _displayParams = <DataTableParams>{};
  private _reloading = false;
  private _resizeInProgress = false;

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

  @Output()
  rowsSelected: EventEmitter<DataTableRow<T>[]> = new EventEmitter();

  // UI components:
  @ContentChild(forwardRef(() => DataTableTitle))
  title: DataTableTitle;
  @ContentChildren(DataTableColumn)
  columns: QueryList<DataTableColumn<T>>;
  @ViewChildren(DataTableRow)
  rows: QueryList<DataTableRow<T>>;
  @ContentChild('expandTemplate')
  expandTemplate: TemplateRef<any>;

  @Input()
  get items() {
    return this._items;
  }

  set items(items: any[]) {
    this._items = items;
    this._onReloadFinished();
  }

  @Input()
  get sortBy() {
    return this._sortBy;
  }

  set sortBy(value) {
    this._sortBy = value;
    this._triggerReload();
  }

  @Input()
  get sortAsc() {
    return this._sortAsc;
  }

  set sortAsc(value) {
    this._sortAsc = value;
    this._triggerReload();
  }

  @Input()
  get offset() {
    return this._offset;
  }

  set offset(value) {
    this._offset = value;
    this._triggerReload();
  }

  @Input()
  get limit() {
    return this._limit;
  }

  set limit(value) {
    this._limit = value;
    this._triggerReload();
  }

  // calculated property:
  @Input()
  get page() {
    return Math.floor(this.offset / this.limit) + 1;
  }

  set page(value) {
    this.offset = (value - 1) * this.limit;
  }

  get lastPage() {
    return Math.ceil(this.itemCount / this.limit);
  }

  get reloading() {
    return this._reloading;
  }

  get displayParams() {
    return this._displayParams;
  }

  get selectAllCheckbox() {
    return this._selectAllCheckbox;
  }

  set selectAllCheckbox(value) {
    this._selectAllCheckbox = value;
    this._onSelectAllChanged(value);
  }

  get columnCount() {
    let count = 0;
    count += this.indexColumnVisible ? 1 : 0;
    count += this.selectColumnVisible ? 1 : 0;
    count += this.expandColumnVisible ? 1 : 0;
    this.columns.toArray().forEach(column => {
      count += column.visible ? 1 : 0;
    });
    return count;
  }

  get substituteItems() {
    return Array.from({ length: this.displayParams!.limit - this.items.length });
  }

  getRowColor(item: any, index: number, row: DataTableRow<T>) {
    if (this.rowColors !== undefined) {
      return (<RowCallback<T>>this.rowColors)(item, row, index);
    }
  }

  // setting multiple observable properties simultaneously
  sort(sortBy: string, asc: boolean) {
    this.sortBy = sortBy;
    this.sortAsc = asc;
  }

  reloadItems() {
    this._reloading = true;
    this.reload.emit(this._getRemoteParameters());
  }

  rowClicked(row: DataTableRow<T>, event: MouseEvent) {
    this.rowClick.emit({ row, event });
  }

  rowDoubleClicked(row: DataTableRow<T>, event: MouseEvent) {
    this.rowDoubleClick.emit({ row, event });
  }

  headerClicked(column: DataTableColumn<T>, event: MouseEvent) {
    if (!this._resizeInProgress) {
      this.headerClick.emit({ column, event });
    } else {
      // this is because I can't prevent click from mousup of the drag end
      this._resizeInProgress = false;
    }
  }

  cellClicked(column: DataTableColumn<T>, row: DataTableRow<T>, event: MouseEvent) {
    this.cellClick.emit({ row, column, event });
  }

  rowExpanded(row: DataTableRow<T>, event: MouseEvent) {
    this.rowExpand.emit({ row, event });
  }

  onRowSelectChanged(row: DataTableRow<T>) {
    console.log('onRowSelectChanged', row);
    // maintain the selectedRow(s) view
    if (this.multiSelect) {
      let index = this.selectedRows.indexOf(row);
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
      this.rows.toArray().filter(row_ => row_.selected).forEach(row_ => {
        if (row_ !== row) { // avoid endless loop
          row_.selected = false;
        }
      });
    }

    let rowsToNotify: DataTableRow<T>[] = [];
    if (this.selectedRow) {
      rowsToNotify.push(this.selectedRow);
    }

    rowsToNotify = rowsToNotify.concat(this.selectedRows);
    this._rowChangeObserver.next(rowsToNotify);

  }

  resizeColumnStart(event: MouseEvent, column: DataTableColumn<T>, columnElement: HTMLElement) {
    this._resizeInProgress = true;
    drag(event, {
      move: (moveEvent: MouseEvent, dx: number) => {
        if (this._isResizeInLimit(columnElement, dx)) {
          column.width = columnElement.offsetWidth + dx;
        }
      },
    });
  }

  // init
  ngOnInit() {
    this._initDefaultValues();
    this._initDefaultClickEvents();
    this._updateDisplayParams();
    if (this.autoReload && this._scheduledReload == null) {
      this.reloadItems();
    }
    // create a observer to debounce onRowSelectChanged event after 300ms notify changes with emitter
    const debounceTimeout: number = this.multiSelect ? 300 : 0;
    Observable.create(observer => {
      this._rowChangeObserver = observer;
    }).pipe(debounceTime(debounceTimeout)).pipe(distinctUntilChanged()).subscribe(items => { this.rowsSelected.emit(items); });
  }

  private _initDefaultValues() {
    this.indexColumnVisible = this.indexColumn;
    this.selectColumnVisible = this.selectColumn;
    this.expandColumnVisible = this.expandableRows;
  }

  private _initDefaultClickEvents() {
    this.headerClick.subscribe(tableEvent => this._sortColumn(tableEvent.column));
    if (this.selectOnRowClick) {
      this.rowClick.subscribe(tableEvent => tableEvent.row.selected = !tableEvent.row.selected);
    }
  }

  private _onReloadFinished() {
    this._updateDisplayParams();
    this._selectAllCheckbox = false;
    this._reloading = false;
  }

  private _updateDisplayParams() {
    this._displayParams = {
      sortBy: this.sortBy,
      sortAsc: this.sortAsc,
      offset: this.offset,
      limit: this.limit
    };
  }

  private _triggerReload() {
    // for avoiding cascading reloads if multiple params are set at once:
    if (this._scheduledReload) {
      clearTimeout(this._scheduledReload);
    }
    this._scheduledReload = setTimeout(() => {
      this.reloadItems();
    });
  }

  private _getRemoteParameters(): DataTableParams {
    let params = <DataTableParams>{};

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

  private _sortColumn(column: DataTableColumn<T>) {
    if (column.sortable) {
      let ascending = this.sortBy === column.property ? !this.sortAsc : true;
      this.sort(column.property, ascending);
    }
  }

  private _onSelectAllChanged(value: boolean) {
    this.rows.toArray().forEach(row => row.selected = value);
  }

  private _isResizeInLimit(columnElement: HTMLElement, dx: number) {
    /* This is needed because CSS min-width didn't work on table-layout: fixed.
     Without the limits, resizing can make the next column disappear completely,
     and even increase the table width. The current implementation suffers from the fact,
     that offsetWidth sometimes contains out-of-date values. */
    return !((dx < 0 && (columnElement.offsetWidth + dx) <= this.resizeLimit) ||
      !columnElement.nextElementSibling || // resizing doesn't make sense for the last visible column
      (dx >= 0 && ((<HTMLElement>columnElement.nextElementSibling).offsetWidth + dx) <= this.resizeLimit));
  }
}

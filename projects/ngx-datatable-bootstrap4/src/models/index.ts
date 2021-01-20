export interface DataTableParams {
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortAsc?: boolean;
}

export interface DataTableRow<T> {
  item: T;
  index?: number;
  selected?: boolean;
  expanded?: boolean;
}

export interface DataTableColumn<T> extends DataTableRow<T> {
  sortable?: boolean;
  property?: string;
  width?: number;
}

export type RowCallback<T> = (row: DataTableRow<T>) => string;
export type CellCallback<T> = (cell: DataTableColumn<T>) => string;

export interface DataTableTranslations {
  indexColumn: string;
  selectColumn: string;
  expandColumn: string;
  paginationLimit: string;
  paginationRange: string;
}

export const defaultTranslations: DataTableTranslations = {
  indexColumn: 'index',
  selectColumn: 'select',
  expandColumn: 'expand',
  paginationLimit: 'Limit',
  paginationRange: 'Results'
};

export interface DataTableRowEvent<T> {
  row?: DataTableRow<T>;
  event?: MouseEvent;
}

export interface DataTableCellEvent<T> {
  cell: DataTableColumn<T>;
  event?: MouseEvent;
}

export interface DataTableHeaderEvent<T> {
  column?: DataTableColumn<T>;
  event?: MouseEvent;
}

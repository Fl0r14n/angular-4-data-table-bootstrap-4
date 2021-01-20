import {Component, forwardRef, Inject} from '@angular/core';
import {DataTableComponent} from '../table/table.component';

@Component({
  selector: 'data-table-pagination',
  templateUrl: 'pagination.component.html',
  styleUrls: ['pagination.component.scss']
})
export class DataTablePaginationComponent<T> {

  constructor(@Inject(forwardRef(() => DataTableComponent)) public dataTable: DataTableComponent<T>) {
  }

  get maxPage(): number {
    return Math.ceil(this.dataTable.itemCount / this.dataTable.limit);
  }

  get limit(): number | string {
    return this.dataTable.limit;
  }

  set limit(value: number | string) {
    if (Number(value) > 0) {
      this.dataTable.limit = Math.floor(+value);
    }
  }

  get page(): number | string {
    return this.dataTable.page;
  }

  set page(value: number | string) {
    if (Number(value) > 0) {
      this.dataTable.page = Math.floor(+value);
    }
  }

  pageBack(): void {
    this.dataTable.offset -= Math.min(this.dataTable.limit, this.dataTable.offset);
  }

  pageForward(): void {
    this.dataTable.offset += this.dataTable.limit;
  }

  pageFirst(): void {
    this.dataTable.offset = 0;
  }

  pageLast(): void {
    this.dataTable.offset = (this.maxPage - 1) * this.dataTable.limit;
  }

  keyPress(event: any): void {
    if (!(Number(event.key) >= 0)) {
      event.preventDefault();
    }
  }
}

import {ContentChild, Directive, Input, OnInit, TemplateRef} from '@angular/core';
import {CellCallback, DataTableColumn} from '../models';

@Directive({
  selector: 'data-table-column'
})
export class DataTableColumnDirective<T> implements DataTableColumn<T>, OnInit {

  ngStyleClass = {};
  index: number;
  item: T;
  selected: boolean;
  // init:
  @Input()
  header: string;
  @Input()
  sortable = false;
  @Input()
  resizable = false;
  @Input()
  property: string;
  @Input()
  styleClass: string;
  @Input()
  cellColors: CellCallback<T>;
  @Input()
  width: number;
  @Input()
  visible = true;

  @ContentChild('cellTemplate')
  cellTemplate: TemplateRef<any>;
  @ContentChild('headerTemplate')
  headerTemplate: TemplateRef<any>;

  get cellColor(): string {
    if (this.cellColors !== undefined) {
      return this.cellColors(this);
    }
  }

  ngOnInit(): void {
    if (!this.styleClass && this.property) {
      if (/^[a-zA-Z0-9_]+$/.test(this.property)) {
        this.styleClass = 'column-' + this.property;
      } else {
        this.styleClass = 'column-' + this.property.replace(/[^a-zA-Z0-9_]/g, '');
      }
    }
    if (this.styleClass != null) {
      this.ngStyleClass = {
        [this.styleClass]: true
      };
    }
  }
}

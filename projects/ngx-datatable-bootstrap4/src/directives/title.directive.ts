import {ContentChild, Directive, Input, TemplateRef} from '@angular/core';

@Directive({
  selector: 'data-table-title'
})
export class DataTableTitleDirective {

  @Input()
  title = '';
  @ContentChild('titleTemplate')
  titleTemplate: TemplateRef<any>;
  @Input()
  controls = true;
}

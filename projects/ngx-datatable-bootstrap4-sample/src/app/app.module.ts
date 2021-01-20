import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {Demo1Component} from './demo1/demo1.component';
import {Demo2Component} from './demo2/demo2.component';
import {Demo3Component} from './demo3/demo3.component';
import {Demo4Component} from './demo4/demo4.component';
import {DataTableModule} from 'ngx-datatable-bootstrap4';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    Demo1Component,
    Demo2Component,
    Demo3Component,
    Demo4Component
  ],
  imports: [
    BrowserModule,
    DataTableModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}

import {Component, ViewChild} from '@angular/core';
import {DataTableResource, DataTableComponent, DataTableParams} from 'ngx-datatable-bootstrap4';

interface Car {
  year?: number;
  maker?: string;
  model?: string;
  desc?: string;
  price?: number;
}

export const cars: Car[] = [
  {year: 1997, maker: 'Ford', model: 'E350', desc: 'ac, abs, moon', price: 3000.00},
  {year: 1999, maker: 'Chevy', model: 'Venture "Extended Edition"', price: 4900.00},
  {year: 1999, maker: 'Checy', model: 'Venture "Extended Edition, Very Large"', price: 5000.00},
  {year: 1996, maker: 'Jeep', model: 'Grand Cherokee', desc: 'air, moon roof, loaded', price: 4799.00}
];

@Component({
  selector: 'demo-2',
  templateUrl: 'demo2.component.html'
})
export class Demo2Component {

  carResource = new DataTableResource<Car>(cars);
  cars: Car[] = [];
  carCount = 0;
  yearLimit = 1999;

  @ViewChild(DataTableComponent, {static: true})
  carsTable: DataTableComponent<Car>;

  constructor() {
    this.rowColors = this.rowColors.bind(this);
    this.carResource.count().then(count => this.carCount = count);
  }

  reloadCars(params: DataTableParams): void {
    this.carResource.query(params).then(vals => this.cars = vals);
  }

  // custom features:

  carClicked(car: any): void {
    alert(car.model);
  }

  rowColors(car: any): string {
    if (car.year >= this.yearLimit) {
      return 'rgb(255, 255, 197)';
    }
  }

  cellClick(event): void {
    console.log(event);
  }
}

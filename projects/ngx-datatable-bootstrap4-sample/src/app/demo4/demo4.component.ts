import {DatePipe} from '@angular/common';
import {Component, ViewEncapsulation} from '@angular/core';
import {DataTableParams, DataTableResource} from 'ngx-datatable-bootstrap4';

interface Film {
  title?: string;
  year?: number;
  expected?: number[];
  rating?: number[];
  director?: string;
}

const films: Film[] = [
  {
    title: 'The Shawshank Redemption',
    year: 1994,
    expected: [8.8, 8.9, 9.0, 9.0, 9.1, 9.1, 9.2, 9.2, 9.2, 9.2],
    rating: [9.2, 9.3, 8.7, 8.9, 8.8, 9.0, 9.0, 9.1, 9.2, 9.2],
    director: 'Frank Darabont',
  },
  {
    title: 'The Godfather',
    year: 1972,
    expected: [8.8, 8.9, 9.0, 9.0, 9.1, 9.1, 9.2, 9.2, 9.2, 9.2],
    rating: [9.2, 9.3, 8.7, 8.9, 8.8, 9.0, 9.0, 9.1, 9.2, 9.2],
    director: 'Francis Ford Coppola',
  },
  {
    title: 'The Godfather: Part II',
    year: 1974,
    expected: [8.8, 8.9, 9.0, 8.7, 8.7, 8.8, 8.8, 8.9, 9.0, 9.2],
    rating: [9.0, 9.1, 8.5, 8.7, 8.6, 8.6, 8.6, 8.7, 8.9, 9.0],
    director: 'Francis Ford Coppola',
  },
  {
    title: 'The Dark Knight',
    year: 2008,
    expected: [8.8, 8.9, 9.0, 8.7, 8.7, 8.8, 8.8, 8.9, 9.0, 9.2],
    rating: [9.0, 9.1, 8.5, 8.7, 8.6, 8.6, 8.6, 8.7, 8.9, 9.0],
    director: 'Christopher Nolan',
  },
  {
    title: 'Pulp Fiction',
    year: 1994,
    expected: [8.8, 8.9, 9.0, 8.7, 8.7, 8.8, 8.8, 8.9, 9.0, 9.2],
    rating: [9.0, 9.1, 8.5, 8.7, 8.6, 8.6, 8.6, 8.7, 8.9, 9.0],
    director: 'Quentin Tarantino',
  }
];

@Component({
  selector: 'demo-4',
  templateUrl: 'demo4.component.html',
  styleUrls: ['demo4.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class Demo4Component {

  filmResource = new DataTableResource<Film>(films);
  items: Film[] = [];
  count = 0;
  today = new Date('2018-01-10');
  datePipe = new DatePipe('en-US');
  weeks: any[];
  months: any[];

  constructor() {
    this.filmResource.count().then(count => this.count = count);
    this.constructDates(this.today);
  }

  reloadFilms(params: DataTableParams): void {
    this.filmResource.query(params).then(vals => this.items = vals);
  }

  private constructDates(date: Date, limit = 10): void {
    const weekMs = 1000 * 3600 * 24 * 7;
    date = new Date(date.getTime() - weekMs * 4);
    const result = [];
    for (let i = 0; i < limit; i++) {
      result.push({
        week: this.datePipe.transform(date, 'w'),
        month: this.datePipe.transform(date, 'MMMM'),
        year: this.datePipe.transform(date, 'yyyy')
      });
      date = new Date(date.getTime() + weekMs);
    }
    this.weeks = result.map((value) => value.week);
    const months = [];
    for (const week of result) {
      const index = months.findIndex(val => val.month === week.month);
      if (index < 0) {
        week.colspan = 1;
        months.push(week);
      } else {
        months[index].colspan++;
      }
    }
    this.months = months;
  }

  incDate(): void {
    this.today.setMonth(this.today.getMonth() + 1);
    this.constructDates(this.today);
  }

  decDate(): void {
    this.today.setMonth(this.today.getMonth() - 1);
    this.constructDates(this.today);
  }
}

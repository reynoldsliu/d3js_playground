import {AfterViewInit, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-company-block',
  templateUrl: './company-block.component.html',
  styleUrls: ['./company-block.component.scss']
})
export class CompanyBlockComponent implements OnInit, AfterViewInit {

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
  }

  toString(updateProps: any): string {
    // get all props
    // set props into html obj
    // parse html obj to string
    // default static, except updateProps has value
    return '';
  }

}

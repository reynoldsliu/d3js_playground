import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'd3js_playground';
  selectedCategory: string = 'cluster';

  categories: any[] = [
    { name: '樹狀圖', key: 'tree' },
    { name: '力圖', key: 'force' },
    { name: '混合圖', key: 'mix' },
    { name: '集群圖', key: 'cluster' },
  ];

  constructor() {}

  ngOnInit(): void {
    console.log('Initial category:', this.selectedCategory);
  }

  onCategoryChange(categoryKey: string): void {
    console.log('Category changed to:', categoryKey);
    this.selectedCategory = categoryKey;
  }
}

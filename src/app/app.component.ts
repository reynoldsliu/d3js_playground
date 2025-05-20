import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'd3js_playground';
  selectedCategory: string = 'force';

  categories: any[] = [
    { name: '樹狀圖', key: 'tree' },
    { name: '力圖', key: 'force' }
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialize any data or configurations here
  }

  onCategoryChange(categoryKey: string): void {
    console.log('Category changed to:', categoryKey);
    this.selectedCategory = categoryKey;

    // Add any additional logic needed when category changes
  }

}

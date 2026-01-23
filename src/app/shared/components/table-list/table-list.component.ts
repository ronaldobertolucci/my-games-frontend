import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  header: string;
  type?: 'text' | 'badge' | 'icon-detail' | 'custom';
  cssClass?: string; // Classe CSS dinâmica para badges, status, etc.
  iconKey?: string;
  titleKey?: string;
  subtitleKey?: string;
}

export interface TableAction {
  icon: string;
  label: string;
  callback: (item: any) => void;
}

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent {
  // Inputs usando signals
  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  actions = input<TableAction[]>([]);

  // Outputs usando signals
  rowClick = output<any>();
  actionClick = output<{ action: TableAction, item: any }>();

  onRowClick(item: any): void {
    this.rowClick.emit(item);
  }

  onActionClick(action: TableAction, item: any, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, item });
  }

  getCellValue(item: any, column: TableColumn): any {
    return item[column.key];
  }

  getCellClass(item: any, column: TableColumn): string {
    // Retorna a classe CSS configurada na coluna, ou vazia
    return column.cssClass || '';
  }
}
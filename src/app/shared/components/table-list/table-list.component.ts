import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  header: string;
  type?: 'text' | 'badge' | 'status' | 'icon-detail';
  badgeClass?: string;
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
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];

  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: TableAction, item: any }>();

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

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Jogando': 'status-playing',
      'Completado': 'status-completed',
      'Backlog': 'status-backlog'
    };
    return statusMap[status] || '';
  }
}
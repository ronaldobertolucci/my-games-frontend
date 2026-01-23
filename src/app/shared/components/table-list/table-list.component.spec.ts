import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableListComponent, TableColumn, TableAction } from './table-list.component';

describe('TableListComponent', () => {
  let component: TableListComponent;
  let fixture: ComponentFixture<TableListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty arrays', () => {
      expect(component.columns()).toEqual([]);
      expect(component.data()).toEqual([]);
      expect(component.actions()).toEqual([]);
    });

    it('should accept columns input', () => {
      const columns: TableColumn[] = [
        { key: 'name', header: 'Nome' },
        { key: 'description', header: 'Descrição' }
      ];

      fixture.componentRef.setInput('columns', columns);
      fixture.detectChanges();

      expect(component.columns()).toEqual(columns);
    });

    it('should accept data input', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      expect(component.data()).toEqual(data);
    });

    it('should accept actions input', () => {
      const actions: TableAction[] = [
        { icon: '✏️', label: 'Editar', callback: () => { } },
        { icon: '🗑️', label: 'Excluir', callback: () => { } }
      ];

      fixture.componentRef.setInput('actions', actions);
      fixture.detectChanges();

      expect(component.actions()).toEqual(actions);
    });
  });

  describe('getCellValue', () => {
    it('should return value from item by column key', () => {
      const item = { name: 'Test Item', description: 'Test Description' };
      const column: TableColumn = { key: 'name', header: 'Nome' };

      const value = component.getCellValue(item, column);

      expect(value).toBe('Test Item');
    });

    it('should return undefined for non-existent key', () => {
      const item = { name: 'Test' };
      const column: TableColumn = { key: 'nonexistent', header: 'Non' };

      const value = component.getCellValue(item, column);

      expect(value).toBeUndefined();
    });

    it('should handle nested properties', () => {
      const item = { user: { name: 'John' } };
      const column: TableColumn = { key: 'user', header: 'User' };

      const value = component.getCellValue(item, column);

      expect(value).toEqual({ name: 'John' });
    });
  });

  describe('getCellClass', () => {
    it('should return cssClass from column', () => {
      const column: TableColumn = {
        key: 'status',
        header: 'Status',
        cssClass: 'status-active'
      };
      const item = { status: 'Active' };

      const cssClass = component.getCellClass(item, column);

      expect(cssClass).toBe('status-active');
    });

    it('should return empty string when cssClass is not defined', () => {
      const column: TableColumn = { key: 'name', header: 'Nome' };
      const item = { name: 'Test' };

      const cssClass = component.getCellClass(item, column);

      expect(cssClass).toBe('');
    });

    it('should work with badge type columns', () => {
      const column: TableColumn = {
        key: 'category',
        header: 'Categoria',
        type: 'badge',
        cssClass: 'badge-primary'
      };
      const item = { category: 'Technology' };

      const cssClass = component.getCellClass(item, column);

      expect(cssClass).toBe('badge-primary');
    });
  });

  describe('onRowClick', () => {
    it('should emit rowClick event with item', (done) => {
      const item = { id: 1, name: 'Test Item' };

      component.rowClick.subscribe((emittedItem: any) => {
        expect(emittedItem).toEqual(item);
        done();
      });

      component.onRowClick(item);
    });

    it('should emit different items correctly', (done) => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      let emissionCount = 0;

      component.rowClick.subscribe((emittedItem: any) => {
        expect(emittedItem).toEqual(items[emissionCount]);
        emissionCount++;
        if (emissionCount === 2) done();
      });

      items.forEach(item => component.onRowClick(item));
    });
  });

  describe('onActionClick', () => {
    it('should emit actionClick event with action and item', (done) => {
      const action: TableAction = {
        icon: '✏️',
        label: 'Editar',
        callback: () => { }
      };
      const item = { id: 1, name: 'Test' };
      const event = new MouseEvent('click');

      component.actionClick.subscribe((result: { action: TableAction, item: any }) => {
        expect(result.action).toEqual(action);
        expect(result.item).toEqual(item);
        done();
      });

      component.onActionClick(action, item, event);
    });

    it('should stop event propagation', () => {
      const action: TableAction = { icon: '🗑️', label: 'Excluir', callback: () => { } };
      const item = { id: 1 };
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.onActionClick(action, item, event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not trigger rowClick when action is clicked', () => {
      const action: TableAction = { icon: '✏️', label: 'Editar', callback: () => { } };
      const item = { id: 1 };
      const event = new MouseEvent('click');
      let rowClickCalled = false;

      component.rowClick.subscribe(() => {
        rowClickCalled = true;
      });

      spyOn(event, 'stopPropagation');
      component.onActionClick(action, item, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(rowClickCalled).toBe(false);
    });
  });

  describe('Column types', () => {
    it('should handle text type columns', () => {
      const columns: TableColumn[] = [
        { key: 'name', header: 'Nome', type: 'text' }
      ];
      const data = [{ name: 'Test Item' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const cell = fixture.nativeElement.querySelector('td span');
      expect(cell.textContent.trim()).toBe('Test Item');
    });

    it('should handle badge type columns', () => {
      const columns: TableColumn[] = [
        {
          key: 'category',
          header: 'Categoria',
          type: 'badge',
          cssClass: 'badge-primary'
        }
      ];
      const data = [{ category: 'Tech' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge).toBeTruthy();
      expect(badge.classList.contains('badge-primary')).toBe(true);
      expect(badge.textContent.trim()).toBe('Tech');
    });

    it('should handle icon-detail type columns', () => {
      const columns: TableColumn[] = [
        {
          key: 'item',
          header: 'Item',
          type: 'icon-detail',
          iconKey: 'icon',
          titleKey: 'name',
          subtitleKey: 'description'
        }
      ];
      const data = [{
        icon: '📦',
        name: 'Product',
        description: 'Product description'
      }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.item-icon');
      const title = fixture.nativeElement.querySelector('.item-title');
      const subtitle = fixture.nativeElement.querySelector('.item-subtitle');

      expect(icon.textContent.trim()).toBe('📦');
      expect(title.textContent.trim()).toBe('Product');
      expect(subtitle.textContent.trim()).toBe('Product description');
    });

    it('should handle custom type columns with dynamic classes', () => {
      const columns: TableColumn[] = [
        {
          key: 'status',
          header: 'Status',
          type: 'custom',
          cssClass: 'custom-status-class'
        }
      ];
      const data = [{ status: 'Active' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const cell = fixture.nativeElement.querySelector('.custom-status-class');
      expect(cell).toBeTruthy();
      expect(cell.textContent.trim()).toBe('Active');
    });
  });

  describe('Actions rendering', () => {
    it('should render action buttons', () => {
      const actions: TableAction[] = [
        { icon: '✏️', label: 'Editar', callback: () => { } },
        { icon: '🗑️', label: 'Excluir', callback: () => { } }
      ];
      const data = [{ id: 1, name: 'Item' }];

      fixture.componentRef.setInput('actions', actions);
      fixture.componentRef.setInput('data', data);
      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.detectChanges();

      const actionButtons = fixture.nativeElement.querySelectorAll('.action-button');
      expect(actionButtons.length).toBe(2);
      expect(actionButtons[0].textContent.trim()).toBe('✏️');
      expect(actionButtons[1].textContent.trim()).toBe('🗑️');
    });

    it('should not render actions column when actions array is empty', () => {
      fixture.componentRef.setInput('actions', []);
      fixture.componentRef.setInput('data', [{ name: 'Item' }]);
      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.detectChanges();

      const actionsHeader = fixture.nativeElement.querySelector('th:last-child');
      expect(actionsHeader.textContent.trim()).not.toBe('Ações');
    });

    it('should set title attribute on action buttons', () => {
      const actions: TableAction[] = [
        { icon: '✏️', label: 'Editar Item', callback: () => { } }
      ];
      const data = [{ id: 1 }];

      fixture.componentRef.setInput('actions', actions);
      fixture.componentRef.setInput('data', data);
      fixture.componentRef.setInput('columns', [{ key: 'id', header: 'ID' }]);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.action-button');
      expect(button.getAttribute('title')).toBe('Editar Item');
    });
  });

  describe('Table rendering', () => {
    it('should render table headers', () => {
      const columns: TableColumn[] = [
        { key: 'name', header: 'Nome' },
        { key: 'email', header: 'E-mail' }
      ];

      fixture.componentRef.setInput('columns', columns);
      fixture.detectChanges();

      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers.length).toBe(2);
      expect(headers[0].textContent.trim()).toBe('Nome');
      expect(headers[1].textContent.trim()).toBe('E-mail');
    });

    it('should render table rows', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('should render empty table when no data', () => {
      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.componentRef.setInput('data', []);
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle icon-detail without subtitle', () => {
      const columns: TableColumn[] = [
        {
          key: 'item',
          header: 'Item',
          type: 'icon-detail',
          iconKey: 'icon',
          titleKey: 'name'
        }
      ];
      const data = [{ icon: '📦', name: 'Product' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const subtitle = fixture.nativeElement.querySelector('.item-subtitle');
      expect(subtitle).toBeFalsy();
    });

    it('should handle missing icon key with default', () => {
      const columns: TableColumn[] = [
        {
          key: 'item',
          header: 'Item',
          type: 'icon-detail',
          titleKey: 'name'
        }
      ];
      const data = [{ icon: '🎯', name: 'Default Icon Test' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.item-icon');
      expect(icon.textContent.trim()).toBe('🎯');
    });

    it('should handle null or undefined values', () => {
      const columns: TableColumn[] = [
        { key: 'name', header: 'Nome' }
      ];
      const data = [{ name: null }, { name: undefined }, { name: '' }];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      const cells = fixture.nativeElement.querySelectorAll('td span');
      expect(cells.length).toBe(3);
    });

    it('should handle multiple column types in same table', () => {
      const columns: TableColumn[] = [
        {
          key: 'item',
          header: 'Item',
          type: 'icon-detail',
          iconKey: 'icon',
          titleKey: 'name'
        },
        {
          key: 'category',
          header: 'Categoria',
          type: 'badge',
          cssClass: 'badge-category'
        },
        { key: 'price', header: 'Preço', type: 'text' }
      ];
      const data = [
        { icon: '📦', name: 'Product 1', category: 'Tech', price: '100' }
      ];

      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.item-icon')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.badge')).toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('td').length).toBe(3);
    });
  });

  describe('Signal reactivity', () => {
    it('should update when columns change', () => {
      const columns1: TableColumn[] = [{ key: 'name', header: 'Nome' }];
      const columns2: TableColumn[] = [
        { key: 'name', header: 'Nome' },
        { key: 'email', header: 'E-mail' }
      ];

      fixture.componentRef.setInput('columns', columns1);
      fixture.detectChanges();
      let headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers.length).toBe(1);

      fixture.componentRef.setInput('columns', columns2);
      fixture.detectChanges();
      headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers.length).toBe(2);
    });

    it('should update when data changes', () => {
      const data1 = [{ name: 'Item 1' }];
      const data2 = [{ name: 'Item 1' }, { name: 'Item 2' }];

      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.componentRef.setInput('data', data1);
      fixture.detectChanges();
      let rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);

      fixture.componentRef.setInput('data', data2);
      fixture.detectChanges();
      rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should update when actions change', () => {
      const actions1: TableAction[] = [
        { icon: '✏️', label: 'Editar', callback: () => { } }
      ];
      const actions2: TableAction[] = [
        { icon: '✏️', label: 'Editar', callback: () => { } },
        { icon: '🗑️', label: 'Excluir', callback: () => { } }
      ];

      fixture.componentRef.setInput('columns', [{ key: 'name', header: 'Nome' }]);
      fixture.componentRef.setInput('data', [{ name: 'Item' }]);
      fixture.componentRef.setInput('actions', actions1);
      fixture.detectChanges();
      let buttons = fixture.nativeElement.querySelectorAll('.action-button');
      expect(buttons.length).toBe(1);

      fixture.componentRef.setInput('actions', actions2);
      fixture.detectChanges();
      buttons = fixture.nativeElement.querySelectorAll('.action-button');
      expect(buttons.length).toBe(2);
    });
  });
});
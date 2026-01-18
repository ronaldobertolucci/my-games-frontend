import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastNotificationComponent, ToastType } from './toast-notification.component';

describe('ToastNotificationComponent', () => {
  let component: ToastNotificationComponent;
  let fixture: ComponentFixture<ToastNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastNotificationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.message).toBe('');
      expect(component.type).toBe('success');
      expect(component.duration).toBe(3000);
      expect(component.show).toBe(false);
    });

    it('should accept custom message', () => {
      component.message = 'Test message';
      expect(component.message).toBe('Test message');
    });

    it('should accept custom type', () => {
      component.type = 'error';
      expect(component.type).toBe('error');
    });

    it('should accept custom duration', () => {
      component.duration = 5000;
      expect(component.duration).toBe(5000);
    });

    it('should auto-close on init if show is true', fakeAsync(() => {
      component.show = true;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(3000);

      expect(component.close).toHaveBeenCalled();
    }));

    it('should not auto-close on init if show is false', fakeAsync(() => {
      component.show = false;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(3000);

      expect(component.close).not.toHaveBeenCalled();
    }));
  });

  describe('close', () => {
    it('should set show to false', () => {
      component.show = true;
      component.close();
      expect(component.show).toBe(false);
    });

    it('should emit showChange event with false', () => {
      spyOn(component.showChange, 'emit');
      component.show = true;

      component.close();

      expect(component.showChange.emit).toHaveBeenCalledWith(false);
    });

    it('should handle multiple close calls', () => {
      spyOn(component.showChange, 'emit');
      component.show = true;

      component.close();
      component.close();

      expect(component.showChange.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('autoClose', () => {
    it('should close after default duration', fakeAsync(() => {
      component.show = true;
      component.duration = 3000;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(2999);
      expect(component.close).not.toHaveBeenCalled();

      tick(1);
      expect(component.close).toHaveBeenCalled();
    }));

    it('should close after custom duration', fakeAsync(() => {
      component.show = true;
      component.duration = 5000;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(4999);
      expect(component.close).not.toHaveBeenCalled();

      tick(1);
      expect(component.close).toHaveBeenCalled();
    }));

    it('should trigger on ngOnChanges when show becomes true', fakeAsync(() => {
      component.show = false;
      component.ngOnChanges();
      spyOn(component, 'close');

      component.show = true;
      component.ngOnChanges();
      tick(3000);

      expect(component.close).toHaveBeenCalled();
    }));
  });

  describe('getIcon', () => {
    it('should return correct icon for success type', () => {
      component.type = 'success';
      expect(component.getIcon()).toBe('✓');
    });

    it('should return correct icon for error type', () => {
      component.type = 'error';
      expect(component.getIcon()).toBe('✕');
    });

    it('should return correct icon for warning type', () => {
      component.type = 'warning';
      expect(component.getIcon()).toBe('⚠');
    });

    it('should return correct icon for info type', () => {
      component.type = 'info';
      expect(component.getIcon()).toBe('ℹ');
    });

    it('should handle type changes', () => {
      component.type = 'success';
      expect(component.getIcon()).toBe('✓');

      component.type = 'error';
      expect(component.getIcon()).toBe('✕');

      component.type = 'info';
      expect(component.getIcon()).toBe('ℹ');
    });
  });

  describe('Toast Types', () => {
    const types: ToastType[] = ['success', 'error', 'warning', 'info'];

    types.forEach(type => {
      it(`should handle ${type} type correctly`, () => {
        component.type = type;
        component.message = `This is a ${type} message`;

        expect(component.type).toBe(type);
        expect(component.getIcon()).toBeDefined();
        expect(component.getIcon().length).toBeGreaterThan(0);
      });
    });
  });

  describe('showChange event', () => {
    it('should emit false when toast closes', () => {
      spyOn(component.showChange, 'emit');
      component.show = true;

      component.close();

      expect(component.showChange.emit).toHaveBeenCalledWith(false);
      expect(component.showChange.emit).toHaveBeenCalledTimes(1);
    });

    it('should work with two-way binding pattern', () => {
      let externalShow = true;
      component.show = externalShow;
      component.showChange.subscribe((value: boolean) => {
        externalShow = value;
      });

      component.close();

      expect(externalShow).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero duration', fakeAsync(() => {
      component.show = true;
      component.duration = 0;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(0);

      expect(component.close).toHaveBeenCalled();
    }));

    it('should handle very long duration', fakeAsync(() => {
      component.show = true;
      component.duration = 10000;
      spyOn(component, 'close');

      component.ngOnInit();
      tick(9999);
      expect(component.close).not.toHaveBeenCalled();

      tick(1);
      expect(component.close).toHaveBeenCalled();
    }));

    it('should handle empty message', () => {
      component.message = '';
      expect(component.message).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      component.message = longMessage;
      expect(component.message).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      component.message = 'Error: Failed to save <Platform>';
      expect(component.message).toContain('<Platform>');
    });

    it('should handle rapid show/hide toggles', fakeAsync(() => {
      spyOn(component.showChange, 'emit');

      component.show = true;
      component.ngOnChanges();
      tick(1000);

      component.show = false;
      component.close();

      component.show = true;
      component.ngOnChanges();
      tick(3000);

      expect(component.showChange.emit).toHaveBeenCalled();
    }));
  });

  describe('Multiple instances', () => {
    it('should maintain independent state for each instance', () => {
      const fixture2 = TestBed.createComponent(ToastNotificationComponent);
      const component2 = fixture2.componentInstance;

      component.message = 'First toast';
      component.type = 'success';
      component.show = true;

      component2.message = 'Second toast';
      component2.type = 'error';
      component2.show = false;

      expect(component.message).toBe('First toast');
      expect(component.type).toBe('success');
      expect(component.show).toBe(true);

      expect(component2.message).toBe('Second toast');
      expect(component2.type).toBe('error');
      expect(component2.show).toBe(false);
    });
  });

  describe('Lifecycle integration', () => {
    it('should auto-close when show changes to true', fakeAsync(() => {
      component.show = false;
      component.duration = 2000;
      spyOn(component, 'close');

      component.show = true;
      component.ngOnChanges();

      tick(2000);

      expect(component.close).toHaveBeenCalled();
    }));

    it('should not auto-close when show is false', fakeAsync(() => {
      component.show = false;
      spyOn(component, 'close');

      component.ngOnChanges();
      tick(5000);

      expect(component.close).not.toHaveBeenCalled();
    }));
  });
});
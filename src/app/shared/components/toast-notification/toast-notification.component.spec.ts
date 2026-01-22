import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
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

  afterEach(() => {
    // Limpar qualquer timeout pendente
    if (component['timeoutId']) {
      clearTimeout(component['timeoutId']);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.message()).toBe('');
      expect(component.type()).toBe('success');
      expect(component.duration()).toBe(3000);
      expect(component.show()).toBe(false);
    });

    it('should accept custom message input', () => {
      fixture.componentRef.setInput('message', 'Test message');
      fixture.detectChanges();

      expect(component.message()).toBe('Test message');
    });

    it('should accept custom type input', () => {
      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();

      expect(component.type()).toBe('error');
    });

    it('should accept custom duration input', () => {
      fixture.componentRef.setInput('duration', 5000);
      fixture.detectChanges();

      expect(component.duration()).toBe(5000);
    });

    it('should auto-close on init if show is true', fakeAsync(() => {
      fixture.componentRef.setInput('show', true);
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.show()).toBe(true);

      tick(3000);

      expect(component.show()).toBe(false);
      discardPeriodicTasks();
    }));

    it('should not auto-close on init if show is false', fakeAsync(() => {
      fixture.componentRef.setInput('show', false);
      component.ngOnInit();
      fixture.detectChanges();

      tick(3000);

      expect(component.show()).toBe(false);
      discardPeriodicTasks();
    }));
  });

  describe('close', () => {
    it('should set show to false', () => {
      component.show.set(true);
      component.close();

      expect(component.show()).toBe(false);
    });

    it('should update show signal when closed', () => {
      component.show.set(true);
      fixture.detectChanges();

      component.close();

      expect(component.show()).toBe(false);
    });

    it('should clear timeout when closing manually', fakeAsync(() => {
      component.show.set(true);
      fixture.detectChanges();
      tick(1000);

      component.close();

      expect(component.show()).toBe(false);

      // Não deve fechar novamente após o tempo original
      tick(2000);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should handle multiple close calls', () => {
      component.show.set(true);

      component.close();
      component.close();
      component.close();

      expect(component.show()).toBe(false);
    });
  });

  describe('autoClose with effect', () => {
    it('should close after default duration via effect', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 3000);
      fixture.detectChanges();

      component.show.set(true);
      fixture.detectChanges();

      expect(component.show()).toBe(true);

      tick(2999);
      expect(component.show()).toBe(true);

      tick(1);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should close after custom duration', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 5000);
      fixture.detectChanges();

      component.show.set(true);
      fixture.detectChanges();

      tick(4999);
      expect(component.show()).toBe(true);

      tick(1);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should reset timer when show changes to true again', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 3000);
      fixture.detectChanges();

      // Primeiro show
      component.show.set(true);
      fixture.detectChanges();
      tick(2000);

      // Fecha e abre novamente - deve resetar timer
      component.show.set(false);
      fixture.detectChanges();
      component.show.set(true);
      fixture.detectChanges();

      tick(2999);
      expect(component.show()).toBe(true);

      tick(1);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));
  });

  describe('getIcon', () => {
    it('should return correct icon for success type', () => {
      fixture.componentRef.setInput('type', 'success');
      fixture.detectChanges();

      expect(component.getIcon()).toBe('✓');
    });

    it('should return correct icon for error type', () => {
      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();

      expect(component.getIcon()).toBe('✕');
    });

    it('should return correct icon for warning type', () => {
      fixture.componentRef.setInput('type', 'warning');
      fixture.detectChanges();

      expect(component.getIcon()).toBe('⚠');
    });

    it('should return correct icon for info type', () => {
      fixture.componentRef.setInput('type', 'info');
      fixture.detectChanges();

      expect(component.getIcon()).toBe('ℹ');
    });

    it('should update icon when type changes', () => {
      fixture.componentRef.setInput('type', 'success');
      fixture.detectChanges();
      expect(component.getIcon()).toBe('✓');

      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();
      expect(component.getIcon()).toBe('✕');

      fixture.componentRef.setInput('type', 'info');
      fixture.detectChanges();
      expect(component.getIcon()).toBe('ℹ');
    });
  });

  describe('Toast Types', () => {
    const types: ToastType[] = ['success', 'error', 'warning', 'info'];

    types.forEach(type => {
      it(`should handle ${type} type correctly`, () => {
        fixture.componentRef.setInput('type', type);
        fixture.componentRef.setInput('message', `This is a ${type} message`);
        fixture.detectChanges();

        expect(component.type()).toBe(type);
        expect(component.message()).toContain(type);
        expect(component.getIcon()).toBeDefined();
        expect(component.getIcon().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Model (two-way binding)', () => {
    it('should support two-way binding pattern', () => {
      let externalShow = false;

      // Simula [(show)]="externalShow"
      component.show.set(true);
      externalShow = component.show();

      expect(externalShow).toBe(true);

      component.close();
      externalShow = component.show();

      expect(externalShow).toBe(false);
    });

    it('should emit changes when show is updated', () => {
      const showValues: boolean[] = [];

      // Observa mudanças no model
      component.show.subscribe(value => {
        showValues.push(value);
      });

      component.show.set(true);
      component.show.set(false);
      component.show.set(true);

      expect(showValues).toContain(true);
      expect(showValues).toContain(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero duration', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 0);
      fixture.detectChanges();

      component.show.set(true);
      fixture.detectChanges();

      tick(0);

      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should handle very long duration', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 10000);
      fixture.detectChanges();

      component.show.set(true);
      fixture.detectChanges();

      tick(9999);
      expect(component.show()).toBe(true);

      tick(1);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should handle empty message', () => {
      fixture.componentRef.setInput('message', '');
      fixture.detectChanges();

      expect(component.message()).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      fixture.componentRef.setInput('message', longMessage);
      fixture.detectChanges();

      expect(component.message()).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      fixture.componentRef.setInput('message', 'Error: Failed to save <Platform>');
      fixture.detectChanges();

      expect(component.message()).toContain('<Platform>');
    });

    it('should handle rapid show/hide toggles', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 1000);
      fixture.detectChanges();

      component.show.set(true);
      fixture.detectChanges();
      tick(500);

      component.show.set(false);
      fixture.detectChanges();
      component.show.set(true);
      fixture.detectChanges();

      // Deve ainda estar aberto
      expect(component.show()).toBe(true);

      tick(1000);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));

    it('should clear previous timeout when reopening', fakeAsync(() => {
      fixture.componentRef.setInput('duration', 2000);
      fixture.detectChanges();

      // Primeira abertura
      component.show.set(true);
      tick(1000);

      // Fecha e reabre imediatamente
      component.show.set(false);
      component.show.set(true);
      fixture.detectChanges();

      // Após 1 segundo do reopen, ainda deve estar aberto
      tick(1000);
      expect(component.show()).toBe(true);

      // Após mais 1 segundo (2s total do reopen), deve fechar
      tick(1000);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));
  });

  describe('Signal reactivity', () => {
    it('should react to input changes', () => {
      fixture.componentRef.setInput('message', 'First message');
      fixture.detectChanges();
      expect(component.message()).toBe('First message');

      fixture.componentRef.setInput('message', 'Second message');
      fixture.detectChanges();
      expect(component.message()).toBe('Second message');
    });

    it('should maintain independent state', () => {
      const messageSignal = component.message;
      const typeSignal = component.type;
      const showSignal = component.show;

      fixture.componentRef.setInput('message', 'Test');
      fixture.componentRef.setInput('type', 'error');
      component.show.set(true);
      fixture.detectChanges();

      expect(messageSignal()).toBe('Test');
      expect(typeSignal()).toBe('error');
      expect(showSignal()).toBe(true);
    });
  });

  describe('Integration with template', () => {
    it('should display toast when show is true', () => {
      component.show.set(true);
      fixture.detectChanges();

      const toastContainer = fixture.nativeElement.querySelector('.toast-container');
      expect(toastContainer).toBeTruthy();
    });

    it('should hide toast when show is false', () => {
      component.show.set(false);
      fixture.detectChanges();

      const toastContainer = fixture.nativeElement.querySelector('.toast-container');
      expect(toastContainer).toBeFalsy();
    });

    it('should display correct message in template', () => {
      fixture.componentRef.setInput('message', 'Test toast message');
      component.show.set(true);
      fixture.detectChanges();

      const messageDiv = fixture.nativeElement.querySelector('.toast-message');
      expect(messageDiv.textContent).toBe('Test toast message');
    });

    it('should apply correct CSS class based on type', () => {
      fixture.componentRef.setInput('type', 'error');
      component.show.set(true);
      fixture.detectChanges();

      const toast = fixture.nativeElement.querySelector('.toast');
      expect(toast.classList.contains('toast-error')).toBe(true);
    });

    it('should close when close button is clicked', () => {
      component.show.set(true);
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.toast-close');
      closeButton.click();
      fixture.detectChanges();

      expect(component.show()).toBe(false);
    });
  });

  describe('Memory leak prevention', () => {
    it('should clear timeout on close', fakeAsync(() => {
      component.show.set(true);
      fixture.detectChanges();

      const timeoutId = component['timeoutId'];
      expect(timeoutId).toBeDefined();

      component.close();
      fixture.detectChanges();

      // Timeout deve ser limpo
      expect(component.show()).toBe(false);

      // Avançar o tempo não deve mudar nada
      tick(5000);
      expect(component.show()).toBe(false);

      discardPeriodicTasks();
    }));
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeFormComponent } from './theme-form.component';
import { Theme } from '../../../core/models/theme.model';
import { signal } from '@angular/core';

describe('ThemeFormComponent', () => {
  let component: ThemeFormComponent;
  let fixture: ComponentFixture<ThemeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with empty form data in create mode', () => {
      expect(component.formData().name).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should initialize with theme data in edit mode', () => {
      const mockTheme: Theme = { id: 1, name: 'Action' };
      
      fixture = TestBed.createComponent(ThemeFormComponent);
      fixture.componentRef.setInput('theme', mockTheme);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.formData().name).toBe('Action');
      expect(component.formData().id).toBe(1);
      expect(component.isEditMode()).toBe(true);
    });

    it('should not modify original theme object in edit mode', () => {
      const mockTheme: Theme = { id: 1, name: 'Action' };
      
      fixture.componentRef.setInput('theme', mockTheme);
      fixture.detectChanges();
      
      component.updateName('Modified Name');
      fixture.detectChanges();

      expect(mockTheme.name).toBe('Action');
      expect(component.formData().name).toBe('Modified Name');
    });

    it('should handle null theme input', () => {
      fixture.componentRef.setInput('theme', null);
      fixture.detectChanges();

      expect(component.formData().name).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should update when theme input changes', () => {
      const theme1: Theme = { id: 1, name: 'Theme 1' };
      const theme2: Theme = { id: 2, name: 'Theme 2' };

      fixture.componentRef.setInput('theme', theme1);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Theme 1');

      fixture.componentRef.setInput('theme', theme2);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Theme 2');
    });
  });

  describe('onSubmit', () => {
    it('should emit save event with form data', (done) => {
      component.formData.set({ name: 'Fantasy' });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe('Fantasy');
        done();
      });

      component.onSubmit();
    });

    it('should trim whitespace from name before emitting', (done) => {
      component.formData.set({ name: '  Action  ' });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe('Action');
        done();
      });

      component.onSubmit();
    });

    it('should emit theme with id in edit mode', (done) => {
      const mockTheme: Theme = { id: 1, name: 'Action' };
      
      fixture.componentRef.setInput('theme', mockTheme);
      fixture.detectChanges();
      
      component.updateName('Fantasy');

      component.save.subscribe((theme: Theme) => {
        expect(theme.id).toBe(1);
        expect(theme.name).toBe('Fantasy');
        done();
      });

      component.onSubmit();
    });

    it('should emit new object (not reference) when submitting', (done) => {
      component.formData.set({ name: 'Horror' });

      component.save.subscribe((theme: Theme) => {
        expect(theme).not.toBe(component.formData());
        expect(theme.name).toBe('Horror');
        done();
      });

      component.onSubmit();
    });

    it('should handle empty name', (done) => {
      component.formData.set({ name: '' });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe('');
        done();
      });

      component.onSubmit();
    });

    it('should handle name with only whitespace', (done) => {
      component.formData.set({ name: '   ' });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe('');
        done();
      });

      component.onSubmit();
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', (done) => {
      component.cancel.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.onCancel();
    });

    it('should not emit save event when canceling', () => {
      let saveCalled = false;
      let cancelCalled = false;

      component.save.subscribe(() => {
        saveCalled = true;
      });

      component.cancel.subscribe(() => {
        cancelCalled = true;
      });

      component.onCancel();

      expect(cancelCalled).toBe(true);
      expect(saveCalled).toBe(false);
    });
  });

  describe('updateName', () => {
    it('should update formData name', () => {
      component.updateName('New Theme');
      expect(component.formData().name).toBe('New Theme');
    });

    it('should preserve id when updating name', () => {
      component.formData.set({ id: 5, name: 'Original' });
      component.updateName('Updated');
      
      expect(component.formData().id).toBe(5);
      expect(component.formData().name).toBe('Updated');
    });

    it('should handle multiple consecutive updates', () => {
      component.updateName('First');
      expect(component.formData().name).toBe('First');

      component.updateName('Second');
      expect(component.formData().name).toBe('Second');

      component.updateName('Third');
      expect(component.formData().name).toBe('Third');
    });
  });

  describe('Signal reactivity', () => {
    it('should react to theme changes via effect', () => {
      const theme1: Theme = { id: 1, name: 'Theme 1' };
      
      fixture.componentRef.setInput('theme', theme1);
      fixture.detectChanges();

      expect(component.formData().name).toBe('Theme 1');
      expect(component.isEditMode()).toBe(true);
    });

    it('should maintain reactivity after multiple changes', () => {
      fixture.componentRef.setInput('theme', { id: 1, name: 'First' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('First');

      fixture.componentRef.setInput('theme', { id: 2, name: 'Second' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('Second');

      fixture.componentRef.setInput('theme', null);
      fixture.detectChanges();
      // formData mantém o último valor, mas isEditMode muda
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in name', (done) => {
      component.formData.set({ name: 'Action®' });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe('Action®');
        done();
      });

      component.onSubmit();
    });

    it('should handle very long names', (done) => {
      const longName = 'A'.repeat(1000);
      component.formData.set({ name: longName });

      component.save.subscribe((theme: Theme) => {
        expect(theme.name).toBe(longName);
        done();
      });

      component.onSubmit();
    });

    it('should handle rapid name updates', () => {
      for (let i = 0; i < 100; i++) {
        component.updateName(`Theme ${i}`);
      }
      
      expect(component.formData().name).toBe('Theme 99');
    });

    it('should preserve other properties when updating name', () => {
      component.formData.set({ id: 10, name: 'Original', customProp: 'value' } as any);
      component.updateName('Updated');
      
      const data = component.formData() as any;
      expect(data.id).toBe(10);
      expect(data.name).toBe('Updated');
      expect(data.customProp).toBe('value');
    });
  });

  describe('Component state with signals', () => {
    it('should maintain independent signal state', () => {
      const formDataSignal = component.formData;
      const isEditModeSignal = component.isEditMode;

      component.formData.set({ name: 'Test' });
      component.isEditMode.set(true);

      expect(formDataSignal()).toEqual({ name: 'Test' });
      expect(isEditModeSignal()).toBe(true);
    });

    it('should allow manual signal updates', () => {
      component.formData.set({ id: 99, name: 'Manual Update' });
      component.isEditMode.set(false);

      expect(component.formData().id).toBe(99);
      expect(component.formData().name).toBe('Manual Update');
      expect(component.isEditMode()).toBe(false);
    });
  });

  describe('Integration with template', () => {
    it('should reflect formData changes in UI', () => {
      component.formData.set({ name: 'Test Theme' });
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input.value).toBe('Test Theme');
    });

    it('should show correct title based on edit mode', () => {
      fixture.componentRef.setInput('theme', null);
      fixture.detectChanges();
      let title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Novo Tema');

      fixture.componentRef.setInput('theme', { id: 1, name: 'Test' });
      fixture.detectChanges();
      title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Editar Tema');
    });
  });
});
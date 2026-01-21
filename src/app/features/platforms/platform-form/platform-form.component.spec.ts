import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformFormComponent } from './platform-form.component';
import { Platform } from '../../../core/models/platform.model';
import { signal } from '@angular/core';

describe('PlatformFormComponent', () => {
  let component: PlatformFormComponent;
  let fixture: ComponentFixture<PlatformFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformFormComponent);
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

    it('should initialize with platform data in edit mode', () => {
      const mockPlatform: Platform = { id: 1, name: 'PlayStation 5' };
      
      fixture = TestBed.createComponent(PlatformFormComponent);
      fixture.componentRef.setInput('platform', mockPlatform);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.formData().name).toBe('PlayStation 5');
      expect(component.formData().id).toBe(1);
      expect(component.isEditMode()).toBe(true);
    });

    it('should not modify original platform object in edit mode', () => {
      const mockPlatform: Platform = { id: 1, name: 'PlayStation 5' };
      
      fixture.componentRef.setInput('platform', mockPlatform);
      fixture.detectChanges();
      
      component.updateName('Modified Name');
      fixture.detectChanges();

      expect(mockPlatform.name).toBe('PlayStation 5');
      expect(component.formData().name).toBe('Modified Name');
    });

    it('should handle null platform input', () => {
      fixture.componentRef.setInput('platform', null);
      fixture.detectChanges();

      expect(component.formData().name).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should update when platform input changes', () => {
      const platform1: Platform = { id: 1, name: 'Platform 1' };
      const platform2: Platform = { id: 2, name: 'Platform 2' };

      fixture.componentRef.setInput('platform', platform1);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Platform 1');

      fixture.componentRef.setInput('platform', platform2);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Platform 2');
    });
  });

  describe('onSubmit', () => {
    it('should emit save event with form data', (done) => {
      component.formData.set({ name: 'Nintendo Switch' });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe('Nintendo Switch');
        done();
      });

      component.onSubmit();
    });

    it('should trim whitespace from name before emitting', (done) => {
      component.formData.set({ name: '  PlayStation 5  ' });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe('PlayStation 5');
        done();
      });

      component.onSubmit();
    });

    it('should emit platform with id in edit mode', (done) => {
      const mockPlatform: Platform = { id: 1, name: 'Xbox Series X' };
      
      fixture.componentRef.setInput('platform', mockPlatform);
      fixture.detectChanges();
      
      component.updateName('Xbox Series S');

      component.save.subscribe((platform: Platform) => {
        expect(platform.id).toBe(1);
        expect(platform.name).toBe('Xbox Series S');
        done();
      });

      component.onSubmit();
    });

    it('should emit new object (not reference) when submitting', (done) => {
      component.formData.set({ name: 'Steam Deck' });

      component.save.subscribe((platform: Platform) => {
        expect(platform).not.toBe(component.formData());
        expect(platform.name).toBe('Steam Deck');
        done();
      });

      component.onSubmit();
    });

    it('should handle empty name', (done) => {
      component.formData.set({ name: '' });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe('');
        done();
      });

      component.onSubmit();
    });

    it('should handle name with only whitespace', (done) => {
      component.formData.set({ name: '   ' });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe('');
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
      component.updateName('New Platform');
      expect(component.formData().name).toBe('New Platform');
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
    it('should react to platform changes via effect', () => {
      const platform1: Platform = { id: 1, name: 'Platform 1' };
      
      fixture.componentRef.setInput('platform', platform1);
      fixture.detectChanges();

      expect(component.formData().name).toBe('Platform 1');
      expect(component.isEditMode()).toBe(true);
    });

    it('should maintain reactivity after multiple changes', () => {
      fixture.componentRef.setInput('platform', { id: 1, name: 'First' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('First');

      fixture.componentRef.setInput('platform', { id: 2, name: 'Second' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('Second');

      fixture.componentRef.setInput('platform', null);
      fixture.detectChanges();
      // formData mantém o último valor, mas isEditMode muda
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in name', (done) => {
      component.formData.set({ name: 'PlayStation® 5' });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe('PlayStation® 5');
        done();
      });

      component.onSubmit();
    });

    it('should handle very long names', (done) => {
      const longName = 'A'.repeat(1000);
      component.formData.set({ name: longName });

      component.save.subscribe((platform: Platform) => {
        expect(platform.name).toBe(longName);
        done();
      });

      component.onSubmit();
    });

    it('should handle rapid name updates', () => {
      for (let i = 0; i < 100; i++) {
        component.updateName(`Platform ${i}`);
      }
      
      expect(component.formData().name).toBe('Platform 99');
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
      component.formData.set({ name: 'Test Platform' });
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input.value).toBe('Test Platform');
    });

    it('should show correct title based on edit mode', () => {
      fixture.componentRef.setInput('platform', null);
      fixture.detectChanges();
      let title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Nova Plataforma');

      fixture.componentRef.setInput('platform', { id: 1, name: 'Test' });
      fixture.detectChanges();
      title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Editar Plataforma');
    });
  });
});
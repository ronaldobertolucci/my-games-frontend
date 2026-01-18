import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformFormComponent } from './platform-form.component';
import { Platform } from '../../../core/models/platform.model';

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
      expect(component.formData.name).toBe('');
      expect(component.isEditMode).toBe(false);
    });

    it('should initialize with platform data in edit mode', () => {
      const mockPlatform: Platform = { id: 1, name: 'PlayStation 5' };
      component.platform = mockPlatform;
      
      component.ngOnInit();

      expect(component.formData).toEqual(mockPlatform);
      expect(component.isEditMode).toBe(true);
    });

    it('should not modify original platform object in edit mode', () => {
      const mockPlatform: Platform = { id: 1, name: 'PlayStation 5' };
      component.platform = mockPlatform;
      
      component.ngOnInit();
      component.formData.name = 'Modified Name';

      expect(component.platform.name).toBe('PlayStation 5');
    });

    it('should handle null platform input', () => {
      component.platform = null;
      
      component.ngOnInit();

      expect(component.formData.name).toBe('');
      expect(component.isEditMode).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should emit save event with form data', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: 'Nintendo Switch' };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: 'Nintendo Switch' });
    });

    it('should trim whitespace from name before emitting', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: '  PlayStation 5  ' };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: 'PlayStation 5' });
    });

    it('should emit platform with id in edit mode', () => {
      spyOn(component.save, 'emit');
      component.platform = { id: 1, name: 'Xbox Series X' };
      component.ngOnInit();
      component.formData.name = 'Xbox Series S';

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ 
        id: 1, 
        name: 'Xbox Series S' 
      });
    });

    it('should emit new object (not reference) when submitting', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: 'Steam Deck' };

      component.onSubmit();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData).not.toBe(component.formData);
      expect(emittedData).toEqual({ name: 'Steam Deck' });
    });

    it('should handle empty name', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: '' };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: '' });
    });

    it('should handle name with only whitespace', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: '   ' };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: '' });
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
    });

    it('should not emit save event when canceling', () => {
      spyOn(component.save, 'emit');
      spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  describe('Input properties', () => {
    it('should accept errorMessage input', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Test error message');
    });

    it('should have empty errorMessage by default', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should update errorMessage when input changes', () => {
      component.errorMessage = 'First error';
      fixture.detectChanges();
      expect(component.errorMessage).toBe('First error');

      component.errorMessage = 'Second error';
      fixture.detectChanges();
      expect(component.errorMessage).toBe('Second error');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in name', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: 'PlayStation® 5' };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: 'PlayStation® 5' });
    });

    it('should handle very long names', () => {
      spyOn(component.save, 'emit');
      const longName = 'A'.repeat(1000);
      component.formData = { name: longName };

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ name: longName });
    });

    it('should handle multiple consecutive submits', () => {
      spyOn(component.save, 'emit');
      component.formData = { name: 'Platform 1' };

      component.onSubmit();
      component.formData.name = 'Platform 2';
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledTimes(2);
      expect((component.save.emit as jasmine.Spy).calls.argsFor(0)[0]).toEqual({ name: 'Platform 1' });
      expect((component.save.emit as jasmine.Spy).calls.argsFor(1)[0]).toEqual({ name: 'Platform 2' });
    });

    it('should preserve id when updating name in edit mode', () => {
      spyOn(component.save, 'emit');
      component.platform = { id: 5, name: 'Original' };
      component.ngOnInit();
      
      component.formData.name = 'Updated';
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({ id: 5, name: 'Updated' });
    });
  });

  describe('Component state', () => {
    it('should maintain isEditMode correctly', () => {
      expect(component.isEditMode).toBe(false);

      component.platform = { id: 1, name: 'Test' };
      component.ngOnInit();

      expect(component.isEditMode).toBe(true);
    });

    it('should not change isEditMode after initialization', () => {
      component.platform = { id: 1, name: 'Test' };
      component.ngOnInit();
      
      const initialEditMode = component.isEditMode;
      component.onSubmit();

      expect(component.isEditMode).toBe(initialEditMode);
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyFormComponent } from './company-form.component';
import { Company } from '../../../core/models/company.model';
import { signal } from '@angular/core';

describe('CompanyFormComponent', () => {
  let component: CompanyFormComponent;
  let fixture: ComponentFixture<CompanyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyFormComponent);
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

    it('should initialize with company data in edit mode', () => {
      const mockCompany: Company = { id: 1, name: 'Naughty Dog' };
      
      fixture = TestBed.createComponent(CompanyFormComponent);
      fixture.componentRef.setInput('company', mockCompany);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.formData().name).toBe('Naughty Dog');
      expect(component.formData().id).toBe(1);
      expect(component.isEditMode()).toBe(true);
    });

    it('should not modify original company object in edit mode', () => {
      const mockCompany: Company = { id: 1, name: 'Naughty Dog' };
      
      fixture.componentRef.setInput('company', mockCompany);
      fixture.detectChanges();
      
      component.updateName('Modified Name');
      fixture.detectChanges();

      expect(mockCompany.name).toBe('Naughty Dog');
      expect(component.formData().name).toBe('Modified Name');
    });

    it('should handle null company input', () => {
      fixture.componentRef.setInput('company', null);
      fixture.detectChanges();

      expect(component.formData().name).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should update when company input changes', () => {
      const company1: Company = { id: 1, name: 'Company 1' };
      const company2: Company = { id: 2, name: 'Company 2' };

      fixture.componentRef.setInput('company', company1);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Company 1');

      fixture.componentRef.setInput('company', company2);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Company 2');
    });
  });

  describe('onSubmit', () => {
    it('should emit save event with form data', (done) => {
      component.formData.set({ name: 'Insomniac' });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe('Insomniac');
        done();
      });

      component.onSubmit();
    });

    it('should trim whitespace from name before emitting', (done) => {
      component.formData.set({ name: '  Naughty Dog  ' });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe('Naughty Dog');
        done();
      });

      component.onSubmit();
    });

    it('should emit company with id in edit mode', (done) => {
      const mockCompany: Company = { id: 1, name: 'Naughty Dog' };
      
      fixture.componentRef.setInput('company', mockCompany);
      fixture.detectChanges();
      
      component.updateName('Insomniac');

      component.save.subscribe((company: Company) => {
        expect(company.id).toBe(1);
        expect(company.name).toBe('Insomniac');
        done();
      });

      component.onSubmit();
    });

    it('should emit new object (not reference) when submitting', (done) => {
      component.formData.set({ name: 'Steam Deck' });

      component.save.subscribe((company: Company) => {
        expect(company).not.toBe(component.formData());
        expect(company.name).toBe('Steam Deck');
        done();
      });

      component.onSubmit();
    });

    it('should handle empty name', (done) => {
      component.formData.set({ name: '' });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe('');
        done();
      });

      component.onSubmit();
    });

    it('should handle name with only whitespace', (done) => {
      component.formData.set({ name: '   ' });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe('');
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
      component.updateName('New Company');
      expect(component.formData().name).toBe('New Company');
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
    it('should react to company changes via effect', () => {
      const company1: Company = { id: 1, name: 'Company 1' };
      
      fixture.componentRef.setInput('company', company1);
      fixture.detectChanges();

      expect(component.formData().name).toBe('Company 1');
      expect(component.isEditMode()).toBe(true);
    });

    it('should maintain reactivity after multiple changes', () => {
      fixture.componentRef.setInput('company', { id: 1, name: 'First' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('First');

      fixture.componentRef.setInput('company', { id: 2, name: 'Second' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('Second');

      fixture.componentRef.setInput('company', null);
      fixture.detectChanges();
      // formData mantém o último valor, mas isEditMode muda
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in name', (done) => {
      component.formData.set({ name: 'Naughty Dog®' });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe('Naughty Dog®');
        done();
      });

      component.onSubmit();
    });

    it('should handle very long names', (done) => {
      const longName = 'A'.repeat(1000);
      component.formData.set({ name: longName });

      component.save.subscribe((company: Company) => {
        expect(company.name).toBe(longName);
        done();
      });

      component.onSubmit();
    });

    it('should handle rapid name updates', () => {
      for (let i = 0; i < 100; i++) {
        component.updateName(`Company ${i}`);
      }
      
      expect(component.formData().name).toBe('Company 99');
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
      component.formData.set({ name: 'Test Company' });
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input.value).toBe('Test Company');
    });

    it('should show correct title based on edit mode', () => {
      fixture.componentRef.setInput('company', null);
      fixture.detectChanges();
      let title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Nova Empresa');

      fixture.componentRef.setInput('company', { id: 1, name: 'Test' });
      fixture.detectChanges();
      title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Editar Empresa');
    });
  });
});
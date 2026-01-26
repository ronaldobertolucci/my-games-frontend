import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenreFormComponent } from './genre-form.component';
import { Genre } from '../../../core/models/genre.model';
import { signal } from '@angular/core';

describe('GenreFormComponent', () => {
  let component: GenreFormComponent;
  let fixture: ComponentFixture<GenreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GenreFormComponent);
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

    it('should initialize with genre data in edit mode', () => {
      const mockGenre: Genre = { id: 1, name: 'Naughty Dog' };
      
      fixture = TestBed.createComponent(GenreFormComponent);
      fixture.componentRef.setInput('genre', mockGenre);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.formData().name).toBe('Naughty Dog');
      expect(component.formData().id).toBe(1);
      expect(component.isEditMode()).toBe(true);
    });

    it('should not modify original genre object in edit mode', () => {
      const mockGenre: Genre = { id: 1, name: 'Naughty Dog' };
      
      fixture.componentRef.setInput('genre', mockGenre);
      fixture.detectChanges();
      
      component.updateName('Modified Name');
      fixture.detectChanges();

      expect(mockGenre.name).toBe('Naughty Dog');
      expect(component.formData().name).toBe('Modified Name');
    });

    it('should handle null genre input', () => {
      fixture.componentRef.setInput('genre', null);
      fixture.detectChanges();

      expect(component.formData().name).toBe('');
      expect(component.isEditMode()).toBe(false);
    });

    it('should update when genre input changes', () => {
      const genre1: Genre = { id: 1, name: 'Genre 1' };
      const genre2: Genre = { id: 2, name: 'Genre 2' };

      fixture.componentRef.setInput('genre', genre1);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Genre 1');

      fixture.componentRef.setInput('genre', genre2);
      fixture.detectChanges();
      expect(component.formData().name).toBe('Genre 2');
    });
  });

  describe('onSubmit', () => {
    it('should emit save event with form data', (done) => {
      component.formData.set({ name: 'Insomniac' });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe('Insomniac');
        done();
      });

      component.onSubmit();
    });

    it('should trim whitespace from name before emitting', (done) => {
      component.formData.set({ name: '  Naughty Dog  ' });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe('Naughty Dog');
        done();
      });

      component.onSubmit();
    });

    it('should emit genre with id in edit mode', (done) => {
      const mockGenre: Genre = { id: 1, name: 'Naughty Dog' };
      
      fixture.componentRef.setInput('genre', mockGenre);
      fixture.detectChanges();
      
      component.updateName('Insomniac');

      component.save.subscribe((genre: Genre) => {
        expect(genre.id).toBe(1);
        expect(genre.name).toBe('Insomniac');
        done();
      });

      component.onSubmit();
    });

    it('should emit new object (not reference) when submitting', (done) => {
      component.formData.set({ name: 'Steam Deck' });

      component.save.subscribe((genre: Genre) => {
        expect(genre).not.toBe(component.formData());
        expect(genre.name).toBe('Steam Deck');
        done();
      });

      component.onSubmit();
    });

    it('should handle empty name', (done) => {
      component.formData.set({ name: '' });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe('');
        done();
      });

      component.onSubmit();
    });

    it('should handle name with only whitespace', (done) => {
      component.formData.set({ name: '   ' });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe('');
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
      component.updateName('New Genre');
      expect(component.formData().name).toBe('New Genre');
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
    it('should react to genre changes via effect', () => {
      const genre1: Genre = { id: 1, name: 'Genre 1' };
      
      fixture.componentRef.setInput('genre', genre1);
      fixture.detectChanges();

      expect(component.formData().name).toBe('Genre 1');
      expect(component.isEditMode()).toBe(true);
    });

    it('should maintain reactivity after multiple changes', () => {
      fixture.componentRef.setInput('genre', { id: 1, name: 'First' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('First');

      fixture.componentRef.setInput('genre', { id: 2, name: 'Second' });
      fixture.detectChanges();
      expect(component.formData().name).toBe('Second');

      fixture.componentRef.setInput('genre', null);
      fixture.detectChanges();
      // formData mantém o último valor, mas isEditMode muda
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in name', (done) => {
      component.formData.set({ name: 'Naughty Dog®' });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe('Naughty Dog®');
        done();
      });

      component.onSubmit();
    });

    it('should handle very long names', (done) => {
      const longName = 'A'.repeat(1000);
      component.formData.set({ name: longName });

      component.save.subscribe((genre: Genre) => {
        expect(genre.name).toBe(longName);
        done();
      });

      component.onSubmit();
    });

    it('should handle rapid name updates', () => {
      for (let i = 0; i < 100; i++) {
        component.updateName(`Genre ${i}`);
      }
      
      expect(component.formData().name).toBe('Genre 99');
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
      component.formData.set({ name: 'Test Genre' });
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[name="name"]') as HTMLInputElement;
      expect(input.value).toBe('Test Genre');
    });

    it('should show correct title based on edit mode', () => {
      fixture.componentRef.setInput('genre', null);
      fixture.detectChanges();
      let title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Novo Gênero');

      fixture.componentRef.setInput('genre', { id: 1, name: 'Test' });
      fixture.detectChanges();
      title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent).toContain('Editar Gênero');
    });
  });
});
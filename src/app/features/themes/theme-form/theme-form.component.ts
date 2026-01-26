import { Component, input, output, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Theme } from '../../../core/models/theme.model';

@Component({
  selector: 'app-theme-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-form.component.html',
  styleUrls: ['./theme-form.component.css']
})
export class ThemeFormComponent implements OnInit {
  theme = input<Theme | null>(null);
  save = output<Theme>();
  cancel = output<void>();

  formData = signal<Theme>({ name: '' });
  isEditMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      const themeValue = this.theme();
      if (themeValue) {
        this.formData.set({ ...themeValue });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    const themeValue = this.theme();
    if (themeValue) {
      this.formData.set({ ...themeValue });
      this.isEditMode.set(true);
    }
  }

  onSubmit(): void {
    const currentFormData = this.formData();
    this.save.emit({ 
      ...currentFormData, 
      name: currentFormData.name.trim() 
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  updateName(name: string): void {
    this.formData.update(data => ({ ...data, name }));
  }
}
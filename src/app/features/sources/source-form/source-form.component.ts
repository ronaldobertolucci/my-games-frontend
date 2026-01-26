import { Component, input, output, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Source } from '../../../core/models/source.model';

@Component({
  selector: 'app-source-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-form.component.html',
  styleUrls: ['./source-form.component.css']
})
export class SourceFormComponent implements OnInit {
  source = input<Source | null>(null);
  save = output<Source>();
  cancel = output<void>();

  formData = signal<Source>({ name: '' });
  isEditMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      const sourceValue = this.source();
      if (sourceValue) {
        this.formData.set({ ...sourceValue });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    const sourceValue = this.source();
    if (sourceValue) {
      this.formData.set({ ...sourceValue });
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
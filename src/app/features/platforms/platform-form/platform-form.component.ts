import { Component, input, output, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Platform } from '../../../core/models/platform.model';

@Component({
  selector: 'app-platform-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platform-form.component.html',
  styleUrls: ['./platform-form.component.css']
})
export class PlatformFormComponent implements OnInit {
  platform = input<Platform | null>(null);
  save = output<Platform>();
  cancel = output<void>();

  formData = signal<Platform>({ name: '' });
  isEditMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      const platformValue = this.platform();
      if (platformValue) {
        this.formData.set({ ...platformValue });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    const platformValue = this.platform();
    if (platformValue) {
      this.formData.set({ ...platformValue });
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
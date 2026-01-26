import { Component, input, output, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Company } from '../../../core/models/company.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent implements OnInit {
  company = input<Company | null>(null);
  save = output<Company>();
  cancel = output<void>();

  formData = signal<Company>({ name: '' });
  isEditMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      const companyValue = this.company();
      if (companyValue) {
        this.formData.set({ ...companyValue });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    const companyValue = this.company();
    if (companyValue) {
      this.formData.set({ ...companyValue });
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
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  @Input() platform: Platform | null = null;
  @Input() errorMessage: string = ''; // Recebe do pai
  @Output() save = new EventEmitter<Platform>();
  @Output() cancel = new EventEmitter<void>();

  formData: Platform = { name: '' };
  isEditMode: boolean = false;

  ngOnInit(): void {
    if (this.platform) {
      this.formData = { ...this.platform };
      this.isEditMode = true;
    }
  }

  onSubmit(): void {
    this.save.emit({ ...this.formData, name: this.formData.name.trim() });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
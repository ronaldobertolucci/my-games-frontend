import { Component, input, output, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Genre } from '../../../core/models/genre.model';

@Component({
  selector: 'app-genre-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './genre-form.component.html',
  styleUrls: ['./genre-form.component.css']
})
export class GenreFormComponent implements OnInit {
  genre = input<Genre | null>(null);
  save = output<Genre>();
  cancel = output<void>();

  formData = signal<Genre>({ name: '' });
  isEditMode = signal<boolean>(false);

  constructor() {
    effect(() => {
      const genreValue = this.genre();
      if (genreValue) {
        this.formData.set({ ...genreValue });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    const genreValue = this.genre();
    if (genreValue) {
      this.formData.set({ ...genreValue });
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
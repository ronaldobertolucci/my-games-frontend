import { Component, input, output, OnInit, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Game } from '../../../core/models/game.model';
import { CompanyService } from '../../../core/services/company.service';
import { GenreService } from '../../../core/services/genre.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Company } from '../../../core/models/company.model';
import { Genre } from '../../../core/models/genre.model';
import { Theme } from '../../../core/models/theme.model';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastNotificationComponent],
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.css']
})
export class GameFormComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly genreService = inject(GenreService);
  private readonly themeService = inject(ThemeService);

  // Inputs e Outputs
  game = input<Game | null>(null);
  save = output<Game>();
  cancel = output<void>();

  // Estado do formulário
  formData = signal<Game>({
    title: '',
    description: '',
    released_at: '',
    company_id: 0,
    genre_ids: [],
    theme_ids: []
  });

  // Listas de dados
  companies = signal<Company[]>([]);
  genres = signal<Genre[]>([]);
  themes = signal<Theme[]>([]);

  // Estados de loading e modais
  isLoadingCompanies = signal<boolean>(false);
  isLoadingGenres = signal<boolean>(false);
  isLoadingThemes = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  errorMessage = signal<string>('');
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Modais de criação rápida
  showCompanyModal = signal<boolean>(false);
  showGenreModal = signal<boolean>(false);
  showThemeModal = signal<boolean>(false);

  newCompanyName = signal<string>('');
  newGenreName = signal<string>('');
  newThemeName = signal<string>('');

  availableGenres = computed(() => {
    const selectedIds = this.formData().genre_ids || [];
    return this.genres().filter(g => !selectedIds.includes(g.id!));
  });

  availableThemes = computed(() => {
    const selectedIds = this.formData().theme_ids || [];
    return this.themes().filter(t => !selectedIds.includes(t.id!));
  });

  constructor() {
    effect(() => {
      const gameValue = this.game();
      if (gameValue) {

        this.formData.set({
          ...gameValue,
          genre_ids: gameValue.genre_ids || [],
          theme_ids: gameValue.theme_ids || []
        });
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadGenres();
    this.loadThemes();

    const gameValue = this.game();
    if (gameValue) {
      this.formData.set({
        ...gameValue,
        genre_ids: gameValue.genre_ids || [],
        theme_ids: gameValue.theme_ids || []
      });
      this.isEditMode.set(true);
    }
  }

  // Métodos para adicionar via dropdown
  addGenreFromDropdown(genreId: string): void {
    const id = Number(genreId);
    if (id > 0 && !this.isGenreSelected(id)) {
      this.toggleGenre(id);
    }
  }

  addThemeFromDropdown(themeId: string): void {
    const id = Number(themeId);
    if (id > 0 && !this.isThemeSelected(id)) {
      this.toggleTheme(id);
    }
  }

  // Atualizar os métodos toggle para garantir arrays:
  toggleGenre(genreId: number): void {
    const currentIds = this.formData().genre_ids || [];
    const newIds = currentIds.includes(genreId)
      ? currentIds.filter(id => id !== genreId)
      : [...currentIds, genreId];

    this.formData.update(d => ({ ...d, genre_ids: newIds }));
  }

  toggleTheme(themeId: number): void {
    const currentIds = this.formData().theme_ids || [];
    const newIds = currentIds.includes(themeId)
      ? currentIds.filter(id => id !== themeId)
      : [...currentIds, themeId];

    this.formData.update(d => ({ ...d, theme_ids: newIds }));
  }

  isGenreSelected(genreId: number): boolean {
    return (this.formData().genre_ids || []).includes(genreId);
  }

  isThemeSelected(themeId: number): boolean {
    return (this.formData().theme_ids || []).includes(themeId);
  }

  // Carregamento de dados
  loadCompanies(): void {
    this.isLoadingCompanies.set(true);
    this.companyService.getCompanies(0, 100).subscribe({
      next: (response) => {
        this.companies.set(response.content);
        this.isLoadingCompanies.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar empresas:', error);
        this.isLoadingCompanies.set(false);
      }
    });
  }

  loadGenres(): void {
    this.isLoadingGenres.set(true);
    this.genreService.getGenres(0, 100).subscribe({
      next: (response) => {
        this.genres.set(response.content);
        this.isLoadingGenres.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar gêneros:', error);
        this.isLoadingGenres.set(false);
      }
    });
  }

  loadThemes(): void {
    this.isLoadingThemes.set(true);
    this.themeService.getThemes(0, 100).subscribe({
      next: (response) => {
        this.themes.set(response.content);
        this.isLoadingThemes.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar temas:', error);
        this.isLoadingThemes.set(false);
      }
    });
  }

  // Helpers para atualizar campos
  updateTitle(title: string): void {
    this.formData.update(d => ({ ...d, title }));
  }

  updateDescription(description: string): void {
    this.formData.update(d => ({ ...d, description }));
  }

  updateReleasedAt(released_at: string): void {
    this.formData.update(d => ({ ...d, released_at }));
  }

  updateCompanyId(company_id: number): void {
    this.formData.update(d => ({ ...d, company_id }));
  }

  onSubmit(): void {
    this.errorMessage.set('');

    const data = this.formData();

    if (!data.title.trim()) {
      this.errorMessage.set('Por favor, preencha o título do jogo');
      return;
    }

    if (!data.company_id || data.company_id === 0) {
      this.errorMessage.set('Por favor, selecione uma empresa');
      return;
    }

    // Emite o jogo com dados trimmed
    this.save.emit({
      ...data,
      title: data.title.trim(),
      description: data.description.trim()
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Criação rápida de Company
  openCompanyModal(): void {
    this.newCompanyName.set('');
    this.showCompanyModal.set(true);
  }

  closeCompanyModal(): void {
    this.showCompanyModal.set(false);
  }

  createCompany(): void {
    const name = this.newCompanyName().trim();
    if (!name) {
      return;
    }

    this.companyService.createCompany({ name }).subscribe({
      next: (created) => {
        this.companies.update(list => [...list, created]);
        this.updateCompanyId(created.id!);
        this.closeCompanyModal();
        this.showToastMessage('Companhia cadastrada com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar empresa:', error);
        this.handleApiError(error, 'companhia')
      }
    });
  }

  // Criação rápida de Genre
  openGenreModal(): void {
    this.newGenreName.set('');
    this.showGenreModal.set(true);
  }

  closeGenreModal(): void {
    this.showGenreModal.set(false);
  }

  createGenre(): void {
    const name = this.newGenreName().trim();
    if (!name) {
      return;
    }

    this.genreService.createGenre({ name }).subscribe({
      next: (created) => {
        this.genres.update(list => [...list, created]);
        this.toggleGenre(created.id!);
        this.closeGenreModal();
        this.showToastMessage('Gênero cadastrado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar gênero:', error);
        this.handleApiError(error, 'gênero')
      }
    });
  }

  // Criação rápida de Theme
  openThemeModal(): void {
    this.newThemeName.set('');
    this.showThemeModal.set(true);
  }

  closeThemeModal(): void {
    this.showThemeModal.set(false);
  }

  createTheme(): void {
    const name = this.newThemeName().trim();
    if (!name) {
      return;
    }

    this.themeService.createTheme({ name }).subscribe({
      next: (created) => {
        this.themes.update(list => [...list, created]);
        this.toggleTheme(created.id!);
        this.closeThemeModal();
        this.showToastMessage('Tema cadastrado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar tema:', error);
        this.handleApiError(error, 'tema')
      }
    });
  }

  getGenreName(genreId: number): string {
    const genre = this.genres().find(g => g.id === genreId);
    return genre?.name || 'Desconhecido';
  }

  getThemeName(themeId: number): string {
    const theme = this.themes().find(t => t.id === themeId);
    return theme?.name || 'Desconhecido';
  }

  private handleApiError(error: any, type: string): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = `Já existe ${type} com este nome`;
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Dados inválidos';
    } else {
      errorMessage = 'Erro ao processar solicitação';
    }

    this.showToastMessage(errorMessage, 'error');
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
  }
}
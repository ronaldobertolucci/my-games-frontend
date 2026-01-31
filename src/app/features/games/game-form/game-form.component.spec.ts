import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameFormComponent } from './game-form.component';
import { CompanyService } from '../../../core/services/company.service';
import { GenreService } from '../../../core/services/genre.service';
import { ThemeService } from '../../../core/services/theme.service';
import { of, throwError } from 'rxjs';
import { Component, signal } from '@angular/core';
import { Game } from '../../../core/models/game.model';
import { Company } from '../../../core/models/company.model';
import { Genre } from '../../../core/models/genre.model';
import { Theme } from '../../../core/models/theme.model';
import { PaginatedResponse } from '../../../core/models/paginated-response.model';

// Componente wrapper para testar inputs/outputs
@Component({
  template: `
    <app-game-form
      [game]="game()"
      (save)="onSave($event)"
      (cancel)="onCancel()">
    </app-game-form>
  `,
  standalone: true,
  imports: [GameFormComponent]
})
class TestHostComponent {
  game = signal<Game | null>(null);
  savedGame: Game | null = null;
  cancelCalled = false;

  onSave(game: Game): void {
    this.savedGame = game;
  }

  onCancel(): void {
    this.cancelCalled = true;
  }
}

describe('GameFormComponent', () => {
  let component: GameFormComponent;
  let fixture: ComponentFixture<GameFormComponent>;
  let companyService: jasmine.SpyObj<CompanyService>;
  let genreService: jasmine.SpyObj<GenreService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  // Mock data
  const mockCompanies: Company[] = [
    { id: 1, name: 'Nintendo' },
    { id: 2, name: 'Sony' }
  ];

  const mockGenres: Genre[] = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'Adventure' },
    { id: 3, name: 'RPG' }
  ];

  const mockThemes: Theme[] = [
    { id: 1, name: 'Fantasy' },
    { id: 2, name: 'Sci-Fi' }
  ];

  const mockCompaniesResponse: PaginatedResponse<Company> = {
    content: mockCompanies,
    totalElements: 2,
    totalPages: 1,
    size: 100,
    number: 0,
    first: true,
    last: true
  };

  const mockGenresResponse: PaginatedResponse<Genre> = {
    content: mockGenres,
    totalElements: 3,
    totalPages: 1,
    size: 100,
    number: 0,
    first: true,
    last: true
  };

  const mockThemesResponse: PaginatedResponse<Theme> = {
    content: mockThemes,
    totalElements: 2,
    totalPages: 1,
    size: 100,
    number: 0,
    first: true,
    last: true
  };

  const mockGame: Game = {
    id: 1,
    title: 'The Legend of Zelda',
    description: 'Adventure game',
    released_at: '2017-03-03',
    company_id: 1,
    genre_ids: [1, 2],
    theme_ids: [1]
  };

  beforeEach(async () => {
    const companyServiceSpy = jasmine.createSpyObj('CompanyService', ['getCompanies', 'createCompany']);
    const genreServiceSpy = jasmine.createSpyObj('GenreService', ['getGenres', 'createGenre']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemes', 'createTheme']);

    await TestBed.configureTestingModule({
      imports: [GameFormComponent],
      providers: [
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: GenreService, useValue: genreServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    companyService = TestBed.inject(CompanyService) as jasmine.SpyObj<CompanyService>;
    genreService = TestBed.inject(GenreService) as jasmine.SpyObj<GenreService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;

    // Setup default spy returns
    companyService.getCompanies.and.returnValue(of(mockCompaniesResponse));
    genreService.getGenres.and.returnValue(of(mockGenresResponse));
    themeService.getThemes.and.returnValue(of(mockThemesResponse));

    fixture = TestBed.createComponent(GameFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load companies, genres, and themes on init', () => {
      fixture.detectChanges();

      expect(companyService.getCompanies).toHaveBeenCalledWith(0, 100);
      expect(genreService.getGenres).toHaveBeenCalledWith(0, 100);
      expect(themeService.getThemes).toHaveBeenCalledWith(0, 100);
      expect(component.companies()).toEqual(mockCompanies);
      expect(component.genres()).toEqual(mockGenres);
      expect(component.themes()).toEqual(mockThemes);
    });

    it('should initialize with empty form data when no game is provided', () => {
      fixture.detectChanges();

      const formData = component.formData();
      expect(formData.title).toBe('');
      expect(formData.description).toBe('');
      expect(formData.released_at).toBe('');
      expect(formData.company_id).toBe(0);
      expect(formData.genre_ids).toEqual([]);
      expect(formData.theme_ids).toEqual([]);
      expect(component.isEditMode()).toBeFalse();
    });

    it('should populate form data when game is provided', () => {
      fixture.componentRef.setInput('game', mockGame);
      fixture.detectChanges();

      const formData = component.formData();
      expect(formData.title).toBe(mockGame.title);
      expect(formData.description).toBe(mockGame.description);
      expect(formData.released_at).toBe(mockGame.released_at);
      expect(formData.company_id).toBe(mockGame.company_id);
      expect(formData.genre_ids).toEqual(mockGame.genre_ids);
      expect(formData.theme_ids).toEqual(mockGame.theme_ids);
      expect(component.isEditMode()).toBeTrue();
    });

    it('should handle loading errors gracefully', () => {
      companyService.getCompanies.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar empresas:', jasmine.any(Error));
      expect(component.isLoadingCompanies()).toBeFalse();
    });
  });

  describe('Form Data Updates', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update title', () => {
      const newTitle = 'New Game Title';
      component.updateTitle(newTitle);

      expect(component.formData().title).toBe(newTitle);
    });

    it('should update description', () => {
      const newDescription = 'New game description';
      component.updateDescription(newDescription);

      expect(component.formData().description).toBe(newDescription);
    });

    it('should update released_at', () => {
      const newDate = '2024-01-01';
      component.updateReleasedAt(newDate);

      expect(component.formData().released_at).toBe(newDate);
    });

    it('should update company_id', () => {
      const newCompanyId = 2;
      component.updateCompanyId(newCompanyId);

      expect(component.formData().company_id).toBe(newCompanyId);
    });
  });

  describe('Genre Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add genre when not selected', () => {
      const genreId = 1;
      component.toggleGenre(genreId);

      expect(component.formData().genre_ids).toContain(genreId);
      expect(component.isGenreSelected(genreId)).toBeTrue();
    });

    it('should remove genre when already selected', () => {
      const genreId = 1;
      component.toggleGenre(genreId);
      expect(component.isGenreSelected(genreId)).toBeTrue();

      component.toggleGenre(genreId);
      expect(component.isGenreSelected(genreId)).toBeFalse();
    });

    it('should add genre from dropdown', () => {
      component.addGenreFromDropdown('2');

      expect(component.formData().genre_ids).toContain(2);
    });

    it('should not add genre from dropdown if already selected', () => {
      component.toggleGenre(2);
      const initialLength = component.formData().genre_ids.length;

      component.addGenreFromDropdown('2');

      expect(component.formData().genre_ids.length).toBe(initialLength);
    });

    it('should not add invalid genre id from dropdown', () => {
      component.addGenreFromDropdown('0');

      expect(component.formData().genre_ids).toEqual([]);
    });

    it('should get genre name by id', () => {
      expect(component.getGenreName(1)).toBe('Action');
      expect(component.getGenreName(999)).toBe('Desconhecido');
    });

    it('should compute available genres correctly', () => {
      component.toggleGenre(1);
      component.toggleGenre(2);

      const available = component.availableGenres();
      expect(available.length).toBe(1);
      expect(available[0].id).toBe(3);
    });
  });

  describe('Theme Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add theme when not selected', () => {
      const themeId = 1;
      component.toggleTheme(themeId);

      expect(component.formData().theme_ids).toContain(themeId);
      expect(component.isThemeSelected(themeId)).toBeTrue();
    });

    it('should remove theme when already selected', () => {
      const themeId = 1;
      component.toggleTheme(themeId);
      expect(component.isThemeSelected(themeId)).toBeTrue();

      component.toggleTheme(themeId);
      expect(component.isThemeSelected(themeId)).toBeFalse();
    });

    it('should add theme from dropdown', () => {
      component.addThemeFromDropdown('1');

      expect(component.formData().theme_ids).toContain(1);
    });

    it('should get theme name by id', () => {
      expect(component.getThemeName(1)).toBe('Fantasy');
      expect(component.getThemeName(999)).toBe('Desconhecido');
    });

    it('should compute available themes correctly', () => {
      component.toggleTheme(1);

      const available = component.availableThemes();
      expect(available.length).toBe(1);
      expect(available[0].id).toBe(2);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit save event with valid data', () => {
      spyOn(component.save, 'emit');

      component.updateTitle('Valid Title');
      component.updateCompanyId(1);
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Valid Title',
          company_id: 1
        })
      );
      expect(component.errorMessage()).toBe('');
    });

    it('should trim title and description before emitting', () => {
      spyOn(component.save, 'emit');

      component.updateTitle('  Title with spaces  ');
      component.updateDescription('  Description with spaces  ');
      component.updateCompanyId(1);
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Title with spaces',
          description: 'Description with spaces'
        })
      );
    });

    it('should show error when title is empty', () => {
      component.updateTitle('   ');
      component.updateCompanyId(1);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, preencha o título do jogo');
    });

    it('should show error when company is not selected', () => {
      component.updateTitle('Valid Title');
      component.updateCompanyId(0);
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, selecione uma empresa');
    });

    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  describe('Quick Creation Modals - Company', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open company modal', () => {
      component.openCompanyModal();

      expect(component.showCompanyModal()).toBeTrue();
      expect(component.newCompanyName()).toBe('');
    });

    it('should close company modal', () => {
      component.openCompanyModal();
      component.closeCompanyModal();

      expect(component.showCompanyModal()).toBeFalse();
    });

    it('should create new company successfully', () => {
      const newCompany: Company = { id: 3, name: 'New Company' };
      companyService.createCompany.and.returnValue(of(newCompany));

      component.newCompanyName.set('New Company');
      component.createCompany();

      expect(companyService.createCompany).toHaveBeenCalledWith({ name: 'New Company' });
      expect(component.companies()).toContain(newCompany);
      expect(component.formData().company_id).toBe(3);
      expect(component.showCompanyModal()).toBeFalse();
    });

    it('should not create company with empty name', () => {
      component.newCompanyName.set('   ');
      component.createCompany();

      expect(companyService.createCompany).not.toHaveBeenCalled();
    });

  });

  describe('Quick Creation Modals - Genre', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open genre modal', () => {
      component.openGenreModal();

      expect(component.showGenreModal()).toBeTrue();
      expect(component.newGenreName()).toBe('');
    });

    it('should close genre modal', () => {
      component.openGenreModal();
      component.closeGenreModal();

      expect(component.showGenreModal()).toBeFalse();
    });

    it('should create new genre successfully', () => {
      const newGenre: Genre = { id: 4, name: 'Strategy' };
      genreService.createGenre.and.returnValue(of(newGenre));

      component.newGenreName.set('Strategy');
      component.createGenre();

      expect(genreService.createGenre).toHaveBeenCalledWith({ name: 'Strategy' });
      expect(component.genres()).toContain(newGenre);
      expect(component.formData().genre_ids).toContain(4);
      expect(component.showGenreModal()).toBeFalse();
    });

    it('should not create genre with empty name', () => {
      component.newGenreName.set('   ');
      component.createGenre();

      expect(genreService.createGenre).not.toHaveBeenCalled();
    });

  });

  describe('Quick Creation Modals - Theme', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open theme modal', () => {
      component.openThemeModal();

      expect(component.showThemeModal()).toBeTrue();
      expect(component.newThemeName()).toBe('');
    });

    it('should close theme modal', () => {
      component.openThemeModal();
      component.closeThemeModal();

      expect(component.showThemeModal()).toBeFalse();
    });

    it('should create new theme successfully', () => {
      const newTheme: Theme = { id: 3, name: 'Horror' };
      themeService.createTheme.and.returnValue(of(newTheme));

      component.newThemeName.set('Horror');
      component.createTheme();

      expect(themeService.createTheme).toHaveBeenCalledWith({ name: 'Horror' });
      expect(component.themes()).toContain(newTheme);
      expect(component.formData().theme_ids).toContain(3);
      expect(component.showThemeModal()).toBeFalse();
    });

    it('should not create theme with empty name', () => {
      component.newThemeName.set('   ');
      component.createTheme();

      expect(themeService.createTheme).not.toHaveBeenCalled();
    });

  });

  describe('Input/Output Integration', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      // Resetar TestBed completamente
      TestBed.resetTestingModule();
      
      await TestBed.configureTestingModule({
        imports: [TestHostComponent, HttpClientTestingModule],
        providers: [
          { provide: CompanyService, useValue: companyService },
          { provide: GenreService, useValue: genreService },
          { provide: ThemeService, useValue: themeService }
        ]
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
    });

    it('should handle game input changes', fakeAsync(() => {
      hostFixture.detectChanges(); // Inicializar o componente
      
      hostComponent.game.set(mockGame);
      hostFixture.detectChanges();
      tick(); // Aguardar processamento do effect

      const formComponent = hostFixture.debugElement.children[0].componentInstance as GameFormComponent;
      expect(formComponent.formData().title).toBe(mockGame.title);
      expect(formComponent.isEditMode()).toBeTrue();
    }));

    it('should emit save event to parent', () => {
      hostFixture.detectChanges();
      
      const formComponent = hostFixture.debugElement.children[0].componentInstance as GameFormComponent;
      formComponent.updateTitle('Test Game');
      formComponent.updateCompanyId(1);
      formComponent.onSubmit();

      expect(hostComponent.savedGame).toBeTruthy();
      expect(hostComponent.savedGame?.title).toBe('Test Game');
    });

    it('should emit cancel event to parent', () => {
      hostFixture.detectChanges();
      
      const formComponent = hostFixture.debugElement.children[0].componentInstance as GameFormComponent;
      formComponent.onCancel();

      expect(hostComponent.cancelCalled).toBeTrue();
    });
  });
});
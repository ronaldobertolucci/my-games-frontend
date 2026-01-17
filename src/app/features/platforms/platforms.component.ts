import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { PlatformService } from '../../core/services/platform.service';
import { Platform } from '../../core/models/platform.model';
import { PlatformFormComponent } from './platform-form/platform-form.component';
import { inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-platforms',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableListComponent,
    PlatformFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './platforms.component.html',
  styleUrls: ['./platforms.component.css']
})
export class PlatformsComponent implements OnInit {
  private confirmService = inject(ConfirmService);

  columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Plataforma',
      type: 'text'
    }
  ];


  actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editPlatform(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deletePlatform(item) }
  ];

  platformsData: Platform[] = [];
  searchTerm: string = '';
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 10;
  isLoading: boolean = false;
  showForm: boolean = false;
  editingPlatform: Platform | null = null;
  formErrorMessage: string = '';
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';
  showToast: boolean = false;
  isFilterActive: boolean = false;

  constructor(private platformService: PlatformService) { }

  ngOnInit(): void {
    this.loadPlatforms();
  }

  loadPlatforms(): void {
    this.isLoading = true;
    this.platformService.getPlatforms(this.currentPage, this.pageSize, this.searchTerm || undefined)
      .subscribe({
        next: (response) => {
          this.platformsData = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.currentPage = response.number;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar plataformas:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.isFilterActive = this.searchTerm.trim().length > 0;
    this.loadPlatforms();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.isFilterActive = false;
    this.currentPage = 0;
    this.loadPlatforms();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPlatforms();
  }

  openCreateForm(): void {
    this.editingPlatform = null;
    this.showForm = true;
  }

  editPlatform(platform: Platform): void {
    this.editingPlatform = { ...platform };
    this.showForm = true;
  }

  deletePlatform(platform: Platform): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir a plataforma "${platform.name}"?`
    ).subscribe((confirmed) => {

      if (confirmed) {
        this.platformService.deletePlatform(platform.id!).subscribe({
          next: () => {
            this.loadPlatforms();
          },
          error: (error) => {
            console.error('Erro ao excluir plataforma:', error);
          }
        });
      }
    });
  }

  onFormSubmit(platform: Platform): void {
    if (this.editingPlatform?.id) {
      this.platformService.updatePlatform(platform).subscribe({
        next: () => {
          this.showToastMessage('Plataforma atualizada com sucesso!', 'success');
          this.closeForm();
          this.loadPlatforms();
        },
        error: (error) => {
          console.error('Erro ao atualizar plataforma:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.platformService.createPlatform(platform).subscribe({
        next: () => {
          this.showToastMessage('Plataforma criada com sucesso!', 'success');
          this.closeForm();
          this.loadPlatforms();
        },
        error: (error) => {
          console.error('Erro ao criar plataforma:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe uma plataforma com este nome';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Dados inválidos';
    } else {
      errorMessage = 'Erro ao processar solicitação';
    }

    this.showToastMessage(errorMessage, 'error');
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPlatform = null;
    this.formErrorMessage = '';
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }
}
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformsComponent } from './platforms.component';
import { PlatformService } from '../../core/services/platform.service';
import { of } from 'rxjs';

describe('PlatformsComponent', () => {
  let component: PlatformsComponent;
  let fixture: ComponentFixture<PlatformsComponent>;
  let platformServiceMock: jasmine.SpyObj<PlatformService>;

  beforeEach(async () => {
    // Criar mock do service com os métodos necessários
    platformServiceMock = jasmine.createSpyObj('PlatformService', [
      'getPlatforms',
      'getPlatformById',
      'createPlatform',
      'updatePlatform',
      'deletePlatform'
    ]);

    // Configurar retorno padrão para getPlatforms
    platformServiceMock.getPlatforms.and.returnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true
    }));

    await TestBed.configureTestingModule({
      imports: [PlatformsComponent],
      providers: [
        { provide: PlatformService, useValue: platformServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load platforms on init', () => {
    expect(platformServiceMock.getPlatforms).toHaveBeenCalled();
  });
});
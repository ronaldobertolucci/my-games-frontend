import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PlatformsComponent } from './features/platforms/platforms.component';
import { authGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './shared/components/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { CompaniesComponent } from './features/companies/companies.component';
import { SourcesComponent } from './features/sources/sources.component';
import { GenresComponent } from './features/genres/genres.component';
import { ThemesComponent } from './features/themes/themes.component';
import { GamesComponent } from './features/games/games.component';
import { MyGamesComponent } from './features/my-games/my-games.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', redirectTo: '/my-games', pathMatch: 'full' },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'my-games', component: MyGamesComponent },
      { path: 'games', component: GamesComponent },
      { path: 'companies', component: CompaniesComponent },
      { path: 'platforms', component: PlatformsComponent },
      { path: 'sources', component: SourcesComponent },
      { path: 'genres', component: GenresComponent },
      { path: 'themes', component: ThemesComponent }
    ]
  },

  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent }
    ]
  },

  { path: '**', redirectTo: '/login' }
];
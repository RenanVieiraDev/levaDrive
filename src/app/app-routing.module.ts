import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {authService} from './shared/services/auth.service';
import {CadastroComponent} from './login/cadastro/cadastro.component';
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full',canActivate:[authService] },
  { path: 'home', loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),canActivate:[authService]},
  {path: 'login',loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)},
  {path:'cadastro',component:CadastroComponent}
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

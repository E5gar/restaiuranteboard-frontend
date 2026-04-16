import { Routes } from '@angular/router';
import { SetupInicialComponent } from './components/setup-inicial/setup-inicial';
import { LoginComponent } from './components/login/login';
import { RecuperarPasswordComponent } from './components/recuperar-password/recuperar-password';
import { RegistroComponent } from './components/registro/registro';
import { GestionAdministradorComponent } from './components/gestion-administrador/gestion-administrador';
import { CrearPersonalComponent } from './components/crear-personal/crear-personal';
import { ConfirmarCuentaComponent } from './components/confirmar-cuenta/confirmar-cuenta';
import { MenuClienteComponent } from './components/menu-cliente/menu-cliente';
import { PanelCajaComponent } from './components/panel-caja/panel-caja';
import { PanelCocinaComponent } from './components/panel-cocina/panel-cocina';
import { PanelRepartidorComponent } from './components/panel-repartidor/panel-repartidor';
import { AdminProductosComponent } from './components/admin-productos/admin-productos';
import { InicioRedirectComponent } from './components/inicio-redirect/inicio-redirect';
import { PresentacionComponent } from './components/presentacion/presentacion';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';
import { configRequiredGuard } from './guards/config-required.guard';
import { setupFlowGuard } from './guards/setup-flow.guard';

export const routes: Routes = [
  { path: 'presentacion', component: PresentacionComponent, canActivate: [configRequiredGuard] },
  { path: 'login', component: LoginComponent, canActivate: [configRequiredGuard, guestGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [configRequiredGuard, guestGuard] },
  { path: 'recuperar', component: RecuperarPasswordComponent, canActivate: [configRequiredGuard, guestGuard] },
  {
    path: 'setup',
    component: SetupInicialComponent,
    canActivate: [setupFlowGuard],
  },
  {
    path: 'gestion-administrador',
    component: GestionAdministradorComponent,
    canActivate: [configRequiredGuard, authGuard, adminGuard],
  },
  {
    path: 'crear-personal',
    component: CrearPersonalComponent,
    canActivate: [configRequiredGuard, authGuard, adminGuard],
  },
  { path: 'confirmar-cuenta', component: ConfirmarCuentaComponent, canActivate: [configRequiredGuard, authGuard] },
  { path: 'menu', component: MenuClienteComponent, canActivate: [configRequiredGuard, authGuard] },
  {
    path: 'admin-productos',
    component: AdminProductosComponent,
    canActivate: [configRequiredGuard, authGuard, adminGuard],
  },
  { path: 'caja', component: PanelCajaComponent, canActivate: [configRequiredGuard, authGuard] },
  { path: 'cocina', component: PanelCocinaComponent, canActivate: [configRequiredGuard, authGuard] },
  { path: 'entregas', component: PanelRepartidorComponent, canActivate: [configRequiredGuard, authGuard] },
  { path: '', component: InicioRedirectComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
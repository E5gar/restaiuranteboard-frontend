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
import { RetenidoComponent } from './components/retenido/retenido';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';
import { configRequiredGuard } from './guards/config-required.guard';
import { setupFlowGuard } from './guards/setup-flow.guard';
import { ipBlockGuard } from './guards/ip-block.guard';

export const routes: Routes = [
  { path: 'retenido', component: RetenidoComponent },
  { path: 'presentacion', component: PresentacionComponent, canActivate: [ipBlockGuard, configRequiredGuard] },
  { path: 'login', component: LoginComponent, canActivate: [ipBlockGuard, configRequiredGuard, guestGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [ipBlockGuard, configRequiredGuard, guestGuard] },
  { path: 'recuperar', component: RecuperarPasswordComponent, canActivate: [ipBlockGuard, configRequiredGuard, guestGuard] },
  {
    path: 'setup',
    component: SetupInicialComponent,
    canActivate: [ipBlockGuard, setupFlowGuard],
  },
  {
    path: 'gestion-administrador',
    component: GestionAdministradorComponent,
    canActivate: [ipBlockGuard, configRequiredGuard, authGuard, adminGuard],
  },
  {
    path: 'crear-personal',
    component: CrearPersonalComponent,
    canActivate: [ipBlockGuard, configRequiredGuard, authGuard, adminGuard],
  },
  { path: 'confirmar-cuenta', component: ConfirmarCuentaComponent, canActivate: [ipBlockGuard, configRequiredGuard, authGuard] },
  { path: 'menu', component: MenuClienteComponent, canActivate: [ipBlockGuard, configRequiredGuard, authGuard] },
  {
    path: 'admin-productos',
    component: AdminProductosComponent,
    canActivate: [ipBlockGuard, configRequiredGuard, authGuard, adminGuard],
  },
  { path: 'caja', component: PanelCajaComponent, canActivate: [ipBlockGuard, configRequiredGuard, authGuard] },
  { path: 'cocina', component: PanelCocinaComponent, canActivate: [ipBlockGuard, configRequiredGuard, authGuard] },
  { path: 'entregas', component: PanelRepartidorComponent, canActivate: [ipBlockGuard, configRequiredGuard, authGuard] },
  { path: '', component: InicioRedirectComponent, canActivate: [ipBlockGuard], pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
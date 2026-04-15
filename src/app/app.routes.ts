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

export const routes: Routes = [
  { path: 'setup', component: SetupInicialComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'recuperar', component: RecuperarPasswordComponent },
  { path: 'gestion-administrador', component: GestionAdministradorComponent },
  { path: 'crear-personal', component: CrearPersonalComponent },
  { path: 'confirmar-cuenta', component: ConfirmarCuentaComponent },
  { path: 'menu', component: MenuClienteComponent },
  { path: 'admin-productos', component: AdminProductosComponent },
  { path: 'caja', component: PanelCajaComponent },
  { path: 'cocina', component: PanelCocinaComponent },
  { path: 'entregas', component: PanelRepartidorComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
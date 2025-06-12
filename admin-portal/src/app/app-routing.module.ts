import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/pharmacies', pathMatch: 'full' },
  { path: 'pharmacies', loadChildren: () => import('./features/pharmacies/pharmacies.module').then(m => m.PharmaciesModule) },
  { path: 'users', loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule) },
  { path: '**', redirectTo: '/pharmacies' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
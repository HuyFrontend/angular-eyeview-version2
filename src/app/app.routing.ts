import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './modules/login/index';
import { HomeComponent } from './modules/home/index';
import { NetworkingComponent } from './modules/networking/index';

const appRoutes: Routes = [
    { path: '', component: LoginComponent },
	{ path: 'home', component: HomeComponent ,
	
	 children: [
      { path: 'networking', component: NetworkingComponent}
    ] },
    // otherwise redirect to home
    { path: '**', redirectTo: '/home' }
];

export const routing = RouterModule.forRoot(appRoutes);
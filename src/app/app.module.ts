import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from "@angular/http";
// import { LeafletModule } from '@asymmetrik/angular2-leaflet';

import { AppComponent } from './app.component';
import { routing }      from './app.routing';

import { AuthService } from './common/services/auth.service';

import { MenuComponent } from './modules/menu/index';

import { LoginComponent } from './modules/login/index';
import { HomeComponent } from './modules/home/index';

import { NetworkingComponent } from './modules/networking/index';
import { MapComponent } from './modules/map/index';

@NgModule({
  declarations: [
    AppComponent,   
    LoginComponent,
    HomeComponent,
    MenuComponent,
    NetworkingComponent,
    MapComponent
  ],
  imports: [
  	routing,
    BrowserModule,
    HttpModule,
    // LeafletModule
  ],
  providers: [
    AuthService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

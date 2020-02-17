import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {GoogleMaps} from '@ionic-native/google-maps'
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import {ReactiveFormsModule} from '@angular/forms';
//components angular
import {CadastroComponent} from './login/cadastro/cadastro.component';
//services
import {authService} from './shared/services/auth.service';
import {Cadastros} from './shared/services/cadastros.service';
import {ValidacoesForm} from './shared/services/validacoesform.service';
import {GetRealTimeDados} from './shared/services/getSetRealTimeDados.service'

@NgModule({
  declarations: [AppComponent,CadastroComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,ReactiveFormsModule],
  providers: [
    StatusBar,
    SplashScreen,
    GoogleMaps,
    Geolocation,
    authService,
    GooglePlus,
    Cadastros,
    ValidacoesForm,
    GetRealTimeDados,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import * as firebase from 'firebase';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
    var firebaseConfig = {
      apiKey: "AIzaSyAKuvd8HlT9Kc7aJSPHdf4LpeiamLLxDYQ",
      authDomain: "levataxi.firebaseapp.com",
      databaseURL: "https://levataxi.firebaseio.com",
      projectId: "levataxi",
      storageBucket: "levataxi.appspot.com",
      messagingSenderId: "434574242052",
      appId: "1:434574242052:web:f7ccdd16e77450386ba051",
      measurementId: "G-PP17D12FK0"
    };
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
  }
}

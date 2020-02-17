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
      apiKey: "AIzaSyBWP-NPd880bPAzM8A3imy4fsX8th4q9Lo",
      authDomain: "leva-97f0f.firebaseapp.com",
      databaseURL: "https://leva-97f0f.firebaseio.com",
      projectId: "leva-97f0f",
      storageBucket: "leva-97f0f.appspot.com",
      messagingSenderId: "527972701100",
      appId: "1:527972701100:web:0af5b22a261f102daaa009",
      measurementId: "G-CP135H285Z"
    };
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
  }
}

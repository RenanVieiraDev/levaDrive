import { Component, OnInit } from '@angular/core';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { AlertController } from '@ionic/angular';
import {FormGroup,FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {authService} from '../shared/services/auth.service';
import {ValidacoesForm} from '../shared/services/validacoesform.service';
import * as firebase from 'firebase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  providers:[authService]
})
export class LoginPage implements OnInit {
  public dadosLoginGoogle;
  public loading = false;
  public dadosLogin = new FormGroup({
    email:new FormControl(null),
    senha:new FormControl(null)
  })
  constructor(private googlePlus: GooglePlus,
              public rota:Router,
              public auth:authService,
              public alertController: AlertController,
              public validacao:ValidacoesForm
              ) { }

  ngOnInit() {
    if(localStorage.getItem('UID')){
      this.rota.navigate(['/home']);
    }
  }

  public loginEmailSenha():void{
    this.loading = true
    if(this.validacao.testeEmail(this.dadosLogin.value.email)
    && this.validacao.valoresVazios(this.dadosLogin.value.senha)){
      this.auth.fazLogin(this.dadosLogin.value)
      .then((uIdUser)=>{
        this.verificaStatusEmail(uIdUser);
      })
      .catch((err)=>{
        this.loading = false;
        let msg = this.validacao.tradutorCode(err.code);
        this.presentAlert('Ops...',err.code,msg);
      });
    }else{
      this.loading = false;
      this.presentAlert('Ops..','a campos invalidos!','Varifique os campos e tente novamente.');
    }
  }
  /*
    obj . email           // 'eddyverbruggen@gmail.com' 
    obj . userId          // ID do usuário 
    obj . displayName     //
      obj . 'Eddy Verbruggen' . familyName      // 'Verbruggen' 
    obj . givenName       // 'Eddy' 
    obj . imageUrl        // 'http://link-to-my-profilepic.google.com' 
    obj . idToken         // idToken que pode ser trocado para verificar a identidade do usuário. 
    obj . serverAuthCode  //Código de autenticação que pode ser trocado por um token de acesso e atualizar o token para 
    obj de acesso offline . accessToken     // token de acesso OAuth2
  */

  public loginComGoogle(){
    this.googlePlus.login({})
    .then(res =>{
      for(let key in res){
        this.dadosLoginGoogle = res[key];
      }
    })
    .catch(err => {
      this.presentAlert('Entrou no catch','erro=>catch',err);
    });
  }

  public verificaStatusEmail(uidUser):void{
    //nivel 0=ADM/ nivel 1=MOTORISTA/ nivel 2=CLIENTE
    if(uidUser.verificacaoConta){
      this.auth.getNivelUser(uidUser.uIdUser)
      .then((resposta)=>{
        this.loading = false;
        switch (resposta.nivel){
          case 0:
            this.auth.salvaDadosNoStorage([{nomeId:'UID',value:uidUser.uIdUser}]);
            this.auth.salvaDadosNoStorage([{nomeId:'nivel',value:resposta.nivel}]);
            //this.rota.navigate(['/ADMComponent']);
            break;
          case 1:
            this.auth.salvaDadosNoStorage([{nomeId:'UID',value:uidUser.uIdUser}]);
            this.auth.salvaDadosNoStorage([{nomeId:'nivel',value:resposta.nivel}]);
            //this.rota.navigate(['/dashboardComponent']);
            break;
          case 2:
            this.auth.salvaDadosNoStorage([{nomeId:'UID',value:uidUser.uIdUser}]);
            this.auth.salvaDadosNoStorage([{nomeId:'nivel',value:resposta.nivel}]);
            this.rota.navigate(['/home']);
            break;
        }
      })
      .catch((err)=>{
        console.log(err);
        let msgErr = this.validacao.tradutorCode(err.code);
        this.presentAlert('ops..',err.code,msgErr);
        this.loading = false;
      });
    }else{
      firebase.auth().signOut();
      this.presentAlert('Ops..','Conta não confirmada!','Por favor, entre no seu email e confime sua conta.');
      this.loading = false;
    }
  }

  async presentAlert(titulo,subTitulo,msg) {
    const alert = await this.alertController.create({
      header: titulo,
      subHeader: subTitulo,
      message: msg,
      buttons: ['Volta']
    });
    await alert.present();
  }

}

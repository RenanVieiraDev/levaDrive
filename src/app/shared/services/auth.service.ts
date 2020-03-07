//import * as firebase from 'firebase';
import {Router,CanActivate} from '@angular/router'
import {EventEmitter} from '@angular/core'
import * as firebase from 'firebase';

export class authService implements CanActivate{
    
     public mostrarMenu = new EventEmitter<boolean>()

    public constructor(public router:Router){}
     
   canActivate():boolean{
       if(localStorage.getItem('UID')) return true;
       this.router.navigate(['login'])
       return false       
   }

    public fazLogin(dadosLogin):Promise<Object>{
        return new Promise((resolve,reject)=>{
          firebase.auth().signInWithEmailAndPassword(dadosLogin.email,dadosLogin.senha)
          .then((resposta)=>{
              let dados = {uIdUser:resposta.user.uid,verificacaoConta:resposta.user.emailVerified}
            resolve(dados);
          })
          .catch((err)=>{
              reject(err);
          })
        })
    }

    public getNivelUser(uId):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${uId}`)
            .once('value')
            .then((resposta)=>{
               resolve(resposta.val());
            })
            .catch((err)=>{
                reject(err);
            });
        })
    }

    public logouf():void{
        /*firebase.auth().signOut()
        .then((resposta)=>{
            localStorage.removeItem('codPath');
            localStorage.removeItem('OTelJS.ClientId');
            localStorage.removeItem('firebase:host:azura-baa9d.firebaseio.com');
            localStorage.removeItem('email');
            localStorage.removeItem('emailEmpresa');
            localStorage.removeItem('tipo');
            localStorage.removeItem('nomeUser');
            localStorage.removeItem('valorDiaria');
            localStorage.removeItem('valorComum');
            localStorage.removeItem('valorMensal');
            localStorage.removeItem('OTelJS.ClientId');
            location.reload();
            //this.mostrarMenu.emit(false);
            //this.router.navigate(['login']);
        })*/
    }

    public salvaDadosNoStorage(dadosAserSalvo:Array<any>):void{
        for(let key in dadosAserSalvo){
          localStorage.setItem(dadosAserSalvo[key].nomeId,dadosAserSalvo[key].value)
        }
    }

}
import * as firebase from 'firebase';
import { Observable } from 'rxjs';
export class GetRealTimeDados{

    public getListaMotoristaOnlines():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            let motoristasOnlines=[],listaTodosOsMotoristas=[];
            firebase.database().ref(`motoristas/`)
            .once('value')
            .then(resposta=>{
                for(let key in resposta.val()){
                  if(resposta.val()[key].online){
                    motoristasOnlines.push(resposta.val()[key]);
                  }
            }
                resolve(motoristasOnlines);
            })
            .catch(err=>{
                reject(err);
            })
        });
    }

    public setMsgChat(uidMotorista,msg):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${uidMotorista}/chat/${localStorage.getItem('UID')}/`)
            .push({de:localStorage.getItem('UID'),para:uidMotorista,msg:msg})
            .then(ok=>{resolve(ok)})
            .catch(err=>{reject(err)});
        });
    }
    
    public pegaSaldoEmConta():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`clientes/${localStorage.getItem('UID')}/saldo`)
            .once('value')
            .then((resposta)=>{
                resolve(resposta.val());
            })
            .catch(err=>{reject(err)})
        });
    }

}
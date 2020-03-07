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

    public setMsgChat(uidCliente,msg):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/chat/${uidCliente}/`)
            .push({de:localStorage.getItem('UID'),para:uidCliente,msg:msg})
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

    public pegaLocalCliente(UIDCliente):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/localClienteCords`)
            .once('value')
            .then((res)=>{
                resolve(res.val())
            })
            .catch(err=>{
                reject(err)
            })
        });
    }

    public pegaLocalDestinoFinal(UIDCliente):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/destinoCords`)
            .once('value')
            .then((res)=>{
                resolve(res.val())
            })
            .catch(err=>{
                reject(err)
            })
        });
    }

    public pegaInformacoesMotoristas():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}`)
            .once('value')
            .then((res)=>{resolve(res.val())})
            .catch(err=>{reject(err)});
        });
    }

    public pegaImagemPerfilMotorista():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.storage().ref()
            .child(`imagensMotoristas/${localStorage.getItem('UID')}/perfil.jpeg`)
            .getDownloadURL()
            .then((urlImagem)=>{
                resolve(urlImagem);
            })
            .catch((err)=>{reject(err)});
        });
    }

}
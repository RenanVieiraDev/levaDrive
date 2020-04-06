import * as firebase from 'firebase';

export class CrudServise{

    public insereValorNoDb(path:string,valor:any):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`${path}`)
           .set(valor)
           .then((ok)=>{resolve('ok')})
           .catch((err)=>{reject(err)});
        });
    }
    public pegaValorNoDb(path:string):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`${path}`)
            .once('value')
            .then((valor)=>{resolve(valor.val())})
            .catch((err)=>{reject(err)})
        });
    }
    public atualizaValorNoDb(path:string,valor:any):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`${path}`)
            .set(valor)
            .then(()=>{resolve('update success')})
            .catch((err)=>{reject(err)})
        });
    }
    public deletaValorNoDb(path:string):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`${path}`)
            .remove()
            .then(()=>{resolve('removido success')})
            .catch((err)=>{reject(err)})
        });
    }
    public acrescentaValorNoDb(path:string,valor:any):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`${path}`)
            .push(valor)
            .then(()=>{resolve('add value success')})
            .catch((err)=>{reject(err)})
        });
    }
}
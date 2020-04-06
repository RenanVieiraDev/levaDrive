import * as firebase from 'firebase';

export class Cadastros{

    public cadastrarMotorista(dadosMotorista,imagens):Promise<any>{
        dadosMotorista.nivel = 1;
        dadosMotorista.horaDataRegistro = this.retornaHoraDataAtual();
        dadosMotorista.verificacao = false;
        dadosMotorista.saldo = 0;
        dadosMotorista.placa = dadosMotorista.placa.toUpperCase();
        dadosMotorista.saldoRealRecebido = 0;
        dadosMotorista.saldoPagamentoParaSistema = 0;
        dadosMotorista.saldoTotalEntrada = 0;
        dadosMotorista.valoresRecebidos = [{deQuem:'',valor:0,data:new Date()}];
        return new Promise((resolve,reject)=>{
            firebase.auth().createUserWithEmailAndPassword(dadosMotorista.email,dadosMotorista.senha)
            .then((ok)=>{
                dadosMotorista.UIDMotorista = ok.user.uid;
                dadosMotorista.localAtual={lat:0,lng:0};
                dadosMotorista.online = false;

                dadosMotorista.corridas = [{nomeCliente:null,
                    localClienteCords:'system',
                    destinoCords:'system',
                    UIDCliente:'system',
                    destinoNome:'system',
                    dataHoraPedido:'system',
                    pedidoAceito:'system',
                    motoristaUID:'system',
                    motoristaNome:'system',
                    localAtualMotorista:'system',
                    pedidoNegadoPor:'system',
                    distancia:'system',
                    duracao:'system',
                    valorCorrida:'system',
                    statusDeCorrida:'system',
                    propostaClienteValor:'system',
                    contraPropostaMotorista:'system'}];
                    

                dadosMotorista.chat = [{de:'system',para:ok.user.uid,msg:'Sejá Bem vindo! :)'}];
                firebase.database().ref(`motoristas/${ok.user.uid}`)
                .set(dadosMotorista)
                .then(()=>{
                    for(let key in imagens){
                         this.salvaImgStorage(`imagensMotoristas/${ok.user.uid}/${imagens[key].nomeImagem}`,imagens[key].arquivo);    
                    }
                    var use = firebase.auth().currentUser;
                    use.sendEmailVerification()
                    .then(()=>{
                        resolve(dadosMotorista)
                    })
                    .catch((err)=>{
                        reject(err)
                    })
                   
                })
                .catch((err)=>{
                    reject(err)
                })
            })
            .catch((err)=>{
                reject(err);
            })
        })
    }

    public salvaImgStorage(pathNome,arquivo):void{
        firebase.storage().ref()
        .child(pathNome)
        .put(arquivo);
    }

    public cadastrarPedidoCorrida(dadosMotorista,dadosCorrida):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${dadosMotorista.dadosMotorista.UIDMotorista}/corridas/${localStorage.getItem('UID')}`)
            .set(dadosCorrida)
            .then(res=>{resolve(`motoristas/${dadosMotorista.dadosMotorista.UIDMotorista}/corridas/${localStorage.getItem('UID')}`);})
            .catch(err=>{reject(err)})
        })
    }

    public retornaHoraDataAtual():any{
        const data= new Date();
        return data.getDate()+'/'+data.getMonth()+1+'/'+data.getFullYear()+' '+ data.getHours()+':'+data.getMinutes()
    }

    public cadastraSaldoEmConta(valor):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`clientes/${localStorage.getItem('UID')}/saldo`)
            .set(valor)
            .then((ok)=>{
               resolve(ok);
            })
            .catch(err=>{
               reject(err);
            })
        })
    }
    public cadastrarEstrelasParaMotorista(valor,val,v):Promise<any>{
        return new Promise<any>((resolve,reject)=>{})
    }
    public alteraValorOnline(uidMotor,valor):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${uidMotor}/online`)
            .set(valor)
            .then(()=>{
                resolve('ok');
            })
            .catch((err)=>{
                reject(err);
            })
        });
    }
    public alteraLocalizacao(uidMotor,valor):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${uidMotor}/localAtual`)
            .set(valor)
            .then(()=>{resolve('ok')})
            .catch((err)=>{reject(err)})
        });
    }

    async cadastraContraPropostaParaCliente(UIDCliente,valorContraProposta,dadosMotor,urlImagemMotorista){
      try{
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/motoristaNome`).set(dadosMotor.nome);
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/urlImagemPerfilMotorista`).set(urlImagemMotorista);
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/motoristaUID`).set(dadosMotor.UIDMotorista);
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/localAtualMotorista`).set(dadosMotor.localAtual);
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/contraPropostaMotorista/valor`).set(valorContraProposta);
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/propostaClienteValor/propostaAceita`).set('contraProposta');           
      }catch{
        return "erro!";
      }
    }

    async aceitaPedido(UIDCliente,urlImagemMotorista){
        firebase.database().ref(`motoristas/${localStorage.getItem('UID')}`)
        .once('value')
        .then( async dadosMotor=>{
            try{
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/propostaClienteValor/propostaAceita`).set('ok');
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/pedidoAceito`).set('ok');
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/localAtualMotorista`).set(dadosMotor.val().localAtual);
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/motoristaNome`).set(dadosMotor.val().nome);
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/motoristaUID`).set(localStorage.getItem('UID'));
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/contraPropostaMotorista/valor`).set(0);
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/urlImagemPerfilMotorista`).set(urlImagemMotorista);
                return 'ok';
            }catch{
                return 'erro!';
            }
           
        })
        .catch(err=>{
            return err;
        })
    }

    async negarAceiteDePedido(UIDCliente,arrayUIDMotoristasRecusa=[]){
        firebase.database().ref(`motoristas/${localStorage.getItem('UID')}`)
        .once('value')
        .then( async dadosMotor=>{
            try{
                arrayUIDMotoristasRecusa.push(localStorage.getItem('UID'));
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/pedidoNegadoPor`).set(arrayUIDMotoristasRecusa);
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/motoristaUID`).set(localStorage.getItem('UID'));
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/contraPropostaMotorista/valor`).set(0);
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/propostaClienteValor/propostaAceita`).set('nao');
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/pedidoAceito`).set('nao');
                await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/statusDeCorrida`).set('recusada');
                return 'ok';
            }catch{
                return 'erro!';
            }
        })
        .catch( err => {return err})
    }

    public alteraEstadoDeVistoCorridaCancelada(UIDCliente):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/cancelamentoVisto`)
            .set(true)
            .then(()=>{resolve('ok')})
            .catch((err)=>{reject(err)})
        });
    }

    public mudaStatusDaCorrida(valor,UIDCliente):Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/statusDeCorrida`)
            .set(valor)
            .then(()=>{resolve('ok')})
            .catch((err)=>{reject(err)})
        });
    }

    public finalizaCorrida(UIDCliente,dadosCorrida):Promise<any>{
         return new Promise<any>((resolve,reject)=>{
            this.pegaSaldoReporParaSistema()
            .then(async (valor)=>{
                try{
                    await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/valorReporParaSistema`).set(parseFloat(valor)+parseFloat(dadosCorrida.saldoDevedorCliente))
                    await firebase.database().ref(`clientes/${UIDCliente}/saldos/saldoDevedor`).set(0);
                    await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/statusDeCorrida`).set("finalizada");
                    await resolve('ok');
                }catch{
                    reject('erro');
                }
            })
        }); 
    }
    
    async finalizaStatusDeCorrida(UIDCliente){
        await firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/corridas/${UIDCliente}/corridaAntiga`).set(true);
    }

    public pegaSaldoReporParaSistema():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            firebase.database().ref(`motoristas/${localStorage.getItem('UID')}/valorReporParaSistema`)
            .once('value')
            .then((res)=>{
                resolve(res.val())
            })
            .catch((err)=>{reject(err)})
        });
    }


}
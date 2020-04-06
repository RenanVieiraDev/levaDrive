import {GoogleMaps,GoogleMap,GoogleMapOptions,Marker,Environment,GoogleMapsAnimation} from '@ionic-native/google-maps';
import * as firebase from 'firebase';
import { Component,ViewChild, OnInit,NgZone} from '@angular/core';
import {Platform,LoadingController} from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {Cadastros} from '../shared/services/cadastros.service';
import {GetRealTimeDados} from '../shared/services/getSetRealTimeDados.service';
import { FormGroup, FormControl } from '@angular/forms';
import { AlertController } from '@ionic/angular';
declare var google:any;
import { Insomnia } from '@ionic-native/insomnia/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';
import {CrudServise} from '../shared/services/Crud.Service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit{

@ViewChild('map',{static:true}) mapaElement:any;
private loading:any;
private map:GoogleMap
private origenMaker:Marker;
private googleDirectionServices = new google.maps.DirectionsService();
private pathDaCorrida:any;
private pathDoChat:any;
private jafoiMapeado= false;
//sistema
private motoristaOnOff:boolean = false;
private painel = 'corridas'; //existe três painel (corridas),(dashboard) e (mapa);
private setIntervalProximidadeMotoristaUsuario:any;
private setIntervalProximidadeMotoristaDestino:any;
private menuInfoCorrida = false;
private notificacaoProximidadeDestinoFinal = false;
private loadindFinalizarCorrida = false;
//motorista
private corridasNotificacoes=[];
private corridasFinalizadas=[];
private corridasRecusadas=[];
private dadosCorridaAceita; //corrida aceita no momento
private aconpanhandoCorridas:string = 'off';
private corridaIniciadaOn = 'off';
private urlImagemPerfilMotorista;
//chat
private msgEnvioChat = new FormGroup({msgSend:new FormControl(null)});
private aconpanhandoOChat:string = 'off';
private conversaChat = [];

  constructor(
    public plataforma:Platform,
    public loadingCtl:LoadingController,
    private geolocation: Geolocation,
    private zone:NgZone,
    public cadastro:Cadastros,
    public realTime:GetRealTimeDados,
    public alertController: AlertController,
    private insomnia: Insomnia,
    private background: BackgroundMode,
    private crudDB:CrudServise
    ) {}

  async ngOnInit(){
    try{
      this.mapaElement = this.mapaElement.nativeElement;
      this.urlImagemPerfilMotorista = await this.realTime.pegaImagemPerfilMotorista();
      this.inicializacaoDoModoOnline({minhaLocalizacao:await this.minhaLocalizacao(),online: new Date().getTime()});
      setInterval(async ()=>{
        this.inicializacaoDoModoOnline({
          minhaLocalizacao:await this.minhaLocalizacao(),
          online: new Date().getTime()
        });
      },2500*60);
      if(this.plataforma.is('android'))await this.insomnia.keepAwake();
    }catch(err){
      console.log(err);
    }
  }

  public inicializacaoDoModoOnline(...params):void{
    if(this.aconpanhandoCorridas === 'off')this.aconpanhaCorridas(`motoristas/${localStorage.getItem('UID')}/corridas/`);
    this.cadastro.alteraValorOnline(localStorage.getItem('UID'),params[0].online).then(()=>{this.motoristaOnOff = true;}).catch(()=>{this.motoristaOnOff = true;})
    .then(()=>{this.motoristaOnOff=true}).catch(()=>{this.motoristaOnOff=false});
    this.cadastro.alteraLocalizacao(localStorage.getItem('UID'),params[0].minhaLocalizacao);
  }

  async minhaLocalizacao(){
    try{
      let watch = await this.geolocation.getCurrentPosition({enableHighAccuracy :  true });
       let meuLOcal = {lat:watch.coords.latitude,lng:watch.coords.longitude}
      return meuLOcal;
    }catch(err){
      alert(err);
    }
  }

  public aconpanhaChat(pathChatAtual):void{
    firebase.database().ref(pathChatAtual)
    .on('value',chatMsgSnapshot=>{
      this.conversaChat = [];
      for(let key in chatMsgSnapshot.val()){
        //msgVoce //msgMotorista
        let Classe = chatMsgSnapshot.val()[key].de === localStorage.getItem('UID') ? 'msgVoce':'msgMotorista';
        let de = chatMsgSnapshot.val()[key].de === localStorage.getItem('UID') ? 'Você':this.dadosCorridaAceita.nomeCliente;
        this.conversaChat.push({deQuem:de,nomeClasse:Classe,dadosMsg:chatMsgSnapshot.val()[key].msg});
      }
      this.aconpanhandoOChat = 'on';
      this.moveScrollBottom('telaId');
    },
    err=>{console.log(err)}
    );
}

  public aconpanhaCorridas(pathPedido){
    firebase.database().ref(pathPedido)
    .on('value', corridaSnapshot=> {
      this.corridasNotificacoes = [];
      this.corridasRecusadas = [];
      let idAguardecont=0;

      for(let key in corridaSnapshot.val()){
        if(corridaSnapshot.val()[key].localClienteCords != 'system'){

          if(corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === 'contraProposta' &&
             corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === "" &&
             corridaSnapshot.val()[key].contraPropostaMotorista.valor > 0
        ){
          //contra proposta em aguardo ================================================================
          this.corridasNotificacoes.push({idContra:`contra${idAguardecont}`,dadosCorrida:corridaSnapshot.val()[key]});
          idAguardecont++;
      }else if(
        corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === 'contraProposta' &&
        corridaSnapshot.val()[key].pedidoAceito === 'ok' &&
        corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === "ok" &&
        corridaSnapshot.val()[key].contraPropostaMotorista.valor > 0
      ){
        //contra proposta aceita ======================================================================
        if(this.corridaIniciadaOn === 'off' && corridaSnapshot.val()[key].statusDeCorrida === 'aguardando'){
          this.painel = 'mapa';
          this.dadosCorridaAceita = corridaSnapshot.val()[key];
          this.corridaIniciadaOn = 'on';
          console.log('Verifique se tem mais pedidos e negue todos');
          this.mapaElement.style.width = this.plataforma.width()+'px';
          this.mapaElement.style.height = this.plataforma.height()+'px';
          this.mapaElement.style.background = 'red';
          this.loadMap(corridaSnapshot.val()[key].UIDCliente,{usuario:corridaSnapshot.val()[key].localClienteCords,destino:corridaSnapshot.val()[key].destinoCords});
        }
        if(corridaSnapshot.val()[key].statusDeCorrida === 'cancelada' && corridaSnapshot.val()[key].cancelamentoVisto == false){
          this.cadastro.alteraEstadoDeVistoCorridaCancelada(corridaSnapshot.val()[key].UIDCliente);
          console.log('pegue o valor da contraProposta e divida por 2 e adiciona ao saldo do motorista');
          this.presentAlertCorridaCanceladaPeloUsuario('Atenção!!!','A corrida foi cancelada pelo o usuario!');
        }
        if(corridaSnapshot.val()[key].statusDeCorrida === 'finalizada' && corridaSnapshot.val()[key].corridaAntiga == false){
          this.insereValoresRecebidosNoDb({
            deQuem:corridaSnapshot.val()[key].UIDCliente,
            valor:corridaSnapshot.val()[key].contraPropostaMotorista.valor,
            dataPagamente:this.retornaHoraDataFormatadaAtual()}
          );
            this.painel = 'corridas';
            this.back();
            this.mapaElement.style.height = "0px";
            this.corridaIniciadaOn = 'off';
            this.cadastro.finalizaStatusDeCorrida(corridaSnapshot.val()[key].UIDCliente);
        }

      }else if(
        corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === 'contraProposta' &&
        corridaSnapshot.val()[key].pedidoAceito === 'nao' &&
        corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === "nao"
      ){
        //contra proposta recusada =======================================================================
        this.corridasRecusadas.push(corridaSnapshot.val()[key]);
      }else if(
        corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === 'ok' &&
        corridaSnapshot.val()[key].pedidoAceito === 'ok' &&
        corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === "" &&
        corridaSnapshot.val()[key].contraPropostaMotorista.valor == 0
      ){
        //pedido aceito direto ==========================================================================
        if(this.corridaIniciadaOn === 'off' && corridaSnapshot.val()[key].statusDeCorrida === 'aguardando'){   
          this.painel = 'mapa';
          this.dadosCorridaAceita = corridaSnapshot.val()[key];
          this.corridaIniciadaOn = 'on';
          console.log('Verifique se tem mais pedidos e negue todos');
          this.mapaElement.style.width = this.plataforma.width()+'px';
          this.mapaElement.style.height = this.plataforma.height()+'px';
          this.mapaElement.style.background = 'red';
          this.loadMap(corridaSnapshot.val()[key].UIDCliente,{usuario:corridaSnapshot.val()[key].localClienteCords,destino:corridaSnapshot.val()[key].destinoCords});
        }
        if(corridaSnapshot.val()[key].statusDeCorrida === 'cancelada' && corridaSnapshot.val()[key].cancelamentoVisto == false){
          this.cadastro.alteraEstadoDeVistoCorridaCancelada(corridaSnapshot.val()[key].UIDCliente);
          console.log('pegue o valor da proposta do cliente e divida por 2 e adiciona ao saldo do motorista');
          this.presentAlertCorridaCanceladaPeloUsuario('Atenção!!!','A corrida foi cancelada pelo o usuario!');
        }
        if(corridaSnapshot.val()[key].statusDeCorrida === 'finalizada' && corridaSnapshot.val()[key].corridaAntiga == false){
          this.insereValoresRecebidosNoDb({
             deQuem:corridaSnapshot.val()[key].UIDCliente,
             valor:corridaSnapshot.val()[key].propostaClienteValor.valor,
             dataPagamente:this.retornaHoraDataFormatadaAtual()
            }
          );

            this.painel = 'corridas';
            this.back();
            this.mapaElement.style.height = "0px";
            this.corridaIniciadaOn = 'off';
            this.cadastro.finalizaStatusDeCorrida(corridaSnapshot.val()[key].UIDCliente);
        }
      }else if(
        corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === 'nao' &&
        corridaSnapshot.val()[key].pedidoAceito === 'nao' &&
        corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === "" &&
        corridaSnapshot.val()[key].contraPropostaMotorista.valor == 0
      ){
        //negação de pedido direto =======================================================================
        console.log('adicione a contra proposta negadas');
        this.corridasRecusadas.push(corridaSnapshot.val()[key]);
      }else if(
        corridaSnapshot.val()[key].propostaClienteValor.propostaAceita === '' &&
        corridaSnapshot.val()[key].pedidoAceito == false &&
        corridaSnapshot.val()[key].contraPropostaMotorista.contraPropostaAceita === '' &&
        corridaSnapshot.val()[key].contraPropostaMotorista.valor === '' &&
        corridaSnapshot.val()[key].motoristaUID === ''
      ){
        //notificação de nova corrida ==========================================================================
        this.corridasNotificacoes.push({idContra:`contra${idAguardecont}`,dadosCorrida:corridaSnapshot.val()[key]});
        idAguardecont++;
      }
        }
      }
      this.aconpanhandoCorridas = 'on'
    })
  }

  public tougleIntpProprosta(id):void{
    let form = document.querySelector('#'+id);
    if ((form.className).indexOf('off') === -1){
      form.className = 'off';
    }else {
      form.className = '';
    }
  }

  async realizarContraProposta(event,uidCliente,classesBTN){
    let dadosMotor = await this.realTime.pegaInformacoesMotoristas();
    await this.tougleIntpProprosta(classesBTN)
    await this.cadastro.cadastraContraPropostaParaCliente(uidCliente,<HTMLInputElement>event.target.elements[0].value,dadosMotor,this.urlImagemPerfilMotorista);
  }

  async aceitaPedido(uidCliente,pedido,...localizacoes){
    await this.cadastro.aceitaPedido(uidCliente,this.urlImagemPerfilMotorista);
  }

  async negarPedido(uidCliente,listaPedidosNegados){
    let resposta = await this.cadastro.negarAceiteDePedido(uidCliente,listaPedidosNegados);
  }

  public trocaPainel(valor){
    this.painel = valor;
  }

  async loadMap(uidCliente,...localizacoes){
    this.loading = await this.loadingCtl.create({message:'por favor, aguarde...'});
    await this.loading.present();

    // This code is necessary for browser
    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyDpyG6IaUupu9UYaa67YgyMUGOOMFMKJSs',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyDpyG6IaUupu9UYaa67YgyMUGOOMFMKJSs'
    });
    if(!this.jafoiMapeado){
      let mapOptions: GoogleMapOptions = {
        controls:{
          zoom:false
        }
      };
      this.map = await GoogleMaps.create(this.mapaElement,mapOptions);
      this.jafoiMapeado = true;
    }

    try{
      let watch = await this.geolocation.getCurrentPosition({enableHighAccuracy :  true });
      let localizacaoAtual ={lat:watch.coords.latitude,lng:watch.coords.longitude};
      //await this.map.one(GoogleMapsEvent.MAP_READY);
      this.loading.dismiss();
      await this.addOriginMaker(localizacaoAtual);
      await this.adicionarMakerNoMapa(
        {makerNome:'Usuario',cor:'rgb(0,0,0)',localizacao:localizacoes[0].usuario},
        {makerNome:'Destino',cor:'rgb(30,144,255)',localizacao:localizacoes[0].destino});
      await this.calcRotaMotoristaClienteDestino(
        {quem:'Motorista',localizacao:localizacaoAtual},
        {quem:'Usuario',localizacao:localizacoes[0].usuario},
        {quem:'Destino',localizacao:localizacoes[0].destino});
      await this.aconpanhaAproximacaoDoUsuarioComMotorista(uidCliente,true);
    
      }catch(err){
      this.presentAlertSystem('Error',err.code,err.message);
    }

  }
  async adicionarMakerNoMapa(...params){
    for(let key in params){
      this.map.addMarkerSync({
        title: params[key].makerNome,
        icon: params[key].cor,
        animation: GoogleMapsAnimation.DROP,
        position:params[key].localizacao
      });
    }
  }

  async  addOriginMaker(minhaLocalizacao){
       try{
          this.map.moveCamera({
          target:minhaLocalizacao,
          zoom:18
        });
        this.origenMaker = this.map.addMarkerSync({
          title: 'Eu',
          icon:'../../assets/icon/icons8-fiat-500-48.png',
          animation: GoogleMapsAnimation.DROP,
          position:minhaLocalizacao
        });
      }catch(err){
        this.presentAlertSystem('Error','erro não','carregou está merdacaralho!');
      }finally{
        this.loading.dismiss();
      }
  }

  async calcRotaMotoristaClienteDestino(...params){
    this.googleDirectionServices.route({
      origin:params[0].localizacao,//de onde
      destination:params[1].localizacao,//para onde
      travelMode:'DRIVING'},
        result=>{
          const points = new Array;
            let rotaMotoristaUsuario = result.routes[0].overview_path;
            for(let i=0;i<rotaMotoristaUsuario.length;i++){
              points[i] ={
                lat:rotaMotoristaUsuario[i].lat(),
                lng:rotaMotoristaUsuario[i].lng()
              }
             
            }
            this.map.addPolyline({
              points:points,
              color:'rgb(255,0,0)',
              width:3
            })
            this.map.moveCamera({target:points});
            this.map.panBy(0,100);
        })
        this.googleDirectionServices.route({
          origin:params[1].localizacao,//de onde
          destination:params[2].localizacao,//para onde
          travelMode:'DRIVING'},
            result=>{
              const pointsDestino = new Array;
                let rotaUsuarioDestino = result.routes[0].overview_path;
                for(let i=0;i<rotaUsuarioDestino.length;i++){
                  pointsDestino[i] ={
                    lat:rotaUsuarioDestino[i].lat(),
                    lng:rotaUsuarioDestino[i].lng()
                  }
                }
                this.map.addPolyline({
                  points:pointsDestino,
                  color:'rgb(255,0,0)',
                  width:3
                })
                this.map.moveCamera({target:pointsDestino});
                this.map.panBy(0,100);
            })
        
   } 

   async aconpanhaAproximacaoDoUsuarioComMotorista(uidCliente,ativarDesativar){ 
    if(ativarDesativar){
      this.setIntervalProximidadeMotoristaUsuario  = setInterval(async ()=>{
        console.log('aconpanhando user')
        let localUsuario = await this.realTime.pegaLocalCliente(uidCliente);
        let distancia = await this.calculaDistEntreDoisPontos(localUsuario);
        distancia = 99;
        if(distancia < 100){
          this.aconpanhaAproximacaoDoDestinoFinal(uidCliente,true);
          this.cadastro.mudaStatusDaCorrida('iniciada',uidCliente);
          pararContagem(this.setIntervalProximidadeMotoristaUsuario);
        }
      },1000*30);
     }else{
      pararContagem(this.setIntervalProximidadeMotoristaUsuario);
     }
      function pararContagem(ref){
        clearInterval(ref);
      }
    }

    async aconpanhaAproximacaoDoDestinoFinal(uidCliente,ativarDesativar){
      if(ativarDesativar){
        this.setIntervalProximidadeMotoristaDestino  = setInterval(async ()=>{
          console.log('aconpanhando destino final');
          let localDestino = await this.realTime.pegaLocalDestinoFinal(uidCliente);
          let distancia = await this.calculaDistEntreDoisPontos(localDestino);
          distancia = 99;
          if(distancia < 100){
            this.notificacaoProximidadeDestinoFinal = true;
            pararContagem(this.setIntervalProximidadeMotoristaDestino);
          }
        },1000*10);
      }else{
        pararContagem(this.setIntervalProximidadeMotoristaDestino);
      }
     
      function pararContagem(ref){
        clearInterval(ref);
      }
    }

    public calculaDistEntreDoisPontos(localCiente):Promise<any>{
       return new Promise<any>((resolve,reject)=>{
        let meuLOcal;
        this.geolocation.getCurrentPosition({enableHighAccuracy :  true })
        .then((watch)=>{
          meuLOcal = {lat:watch.coords.latitude,lng:watch.coords.longitude};
          var service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: [meuLOcal],
              destinations: [localCiente],
              travelMode: 'DRIVING',
              avoidHighways: true,
              avoidTolls: true,
            }, result=>{
              resolve(result.rows[0].elements[0].distance.value);
              //return result.rows[0].elements[0].distance.value;
            });
        })
        .catch(err=>{
          reject(err);
        })
       });
    }

  //app cliente=================================================================================================
  async presentAlertSystem(titulo,subTitulo,msg) {
    const alert = await this.alertController.create({
      header: titulo,
      subHeader: subTitulo,
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentAlertConfirm(titulo,msg) {
    const alert = await this.alertController.create({
      header: titulo+'!',
      message: `<strong>${msg}</strong>`,
      buttons: [
        {
          text: 'Inicio',
          handler: () => {
            this.back();
          }
        }
      ]
    });

    await alert.present();
  }

  async presentAlertCorridaCanceladaPeloUsuario(titulo,msg) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msg,
      buttons: [
        {
          text: 'ok',
          handler: async () => {
            this.painel = 'corridas';
            this.back();
            this.mapaElement.style.height = "0px";
            this.corridaIniciadaOn = 'off';
            this.aconpanhaAproximacaoDoUsuarioComMotorista(null,false);
            this.aconpanhaAproximacaoDoDestinoFinal(null,false);
            //this.atualizaSaldoEmConta('cancelamento');
            //this.removeConexao(this.pathDoChat);
            //this.removeConexao(this.pathDaCorrida);
          }
        }
      ]
    });

    await alert.present();
  }

  async back(){
    try{
      await this.map.clear();
    }catch(err){
      this.presentAlertSystem('Error',err.code,err.message);
    }
  }

  public abrirFecharChat():void{
    let chat = document.querySelector('#chatId');

    if ((chat.className).indexOf('off') === -1){
      chat.className = 'off';
    }else {
      chat.className = 'chatFiltro';
    }
    if(this.aconpanhandoOChat === 'off'){
      this.pathDoChat = `motoristas/${localStorage.getItem('UID')}/chat/${this.dadosCorridaAceita.UIDCliente}/`;
      this.aconpanhaChat(`motoristas/${localStorage.getItem('UID')}/chat/${this.dadosCorridaAceita.UIDCliente}/`);
    }
    this.moveScrollBottom('telaId');
  }

  public enviarMsgChat():void{
    if(this.msgEnvioChat.value.msgSend !== null){
      this.realTime.setMsgChat(this.dadosCorridaAceita.UIDCliente,this.msgEnvioChat.value.msgSend)
      .then((resPath)=>{})
      .catch((err)=>{
        this.presentAlertSystem('Error',err.code,err.message);
      })
      this.msgEnvioChat.reset()
    }
  }

 

public moveScrollBottom(idElement):void{
  this.zone.run(()=>{
    let tela = document.querySelector('#'+idElement);
    setTimeout(()=>{
      tela.scrollTop = tela.scrollHeight;
    },200);
  });
}

public  removeConexao(pathNode):void{
  firebase.database().ref(pathNode).off();
}

async insereValoresRecebidosNoDb(pagamentoCliente:object){
  await this.crudDB.acrescentaValorNoDb(`motoristas/${localStorage.getItem('UID')}/valoresRecebidos`,pagamentoCliente)
  let listaComValoresRecebidos = await this.crudDB.pegaValorNoDb(`motoristas/${localStorage.getItem('UID')}/valoresRecebidos`);
  await this.atualizaSaldoEmConta(listaComValoresRecebidos);
}

async atualizaSaldoEmConta(listaRecebimentos){
  let dataAtualDoSistema = this.retornaHoraDataFormatadaAtual();
  let valorTarifaSistema = 0 ,valorRecebidoPeloMotorista = 0;
  for(let key in listaRecebimentos){
    if(listaRecebimentos[key].dataPagamente == dataAtualDoSistema){
      //console.log(listaRecebimentos[key])
      let tarifa = (listaRecebimentos[key].valor*25)/100;
      let valorHaReceber = listaRecebimentos[key].valor - tarifa;
      //valores totais========
      valorTarifaSistema += tarifa;
      valorRecebidoPeloMotorista += valorHaReceber;
    }
  }
  await this.crudDB.atualizaValorNoDb(`motoristas/${localStorage.getItem('UID')}/saldoPagamentoParaSistema`,valorTarifaSistema);
  await this.crudDB.atualizaValorNoDb(`motoristas/${localStorage.getItem('UID')}/saldoRealRecebido`,valorRecebidoPeloMotorista);
}

public mostrarMenuInfoCorrida(){
  this.menuInfoCorrida = this.menuInfoCorrida === false ? true:false;
  let menu = document.querySelector('#menuInfoCorrida');
  let secao = document.querySelector('#secaoMenu');
  if(this.menuInfoCorrida){
    menu.className = "menuRigthInfoCorridaOn";
    secao.className = "secaoOn";
  }else if(this.menuInfoCorrida === false){
    menu.className = "menuRigthInfoCorridaOff";
    secao.className = "secaoOff";
  }
}

public finalizarCorrida():void{
  this.loadindFinalizarCorrida = true;
  this.cadastro.finalizaCorrida(this.dadosCorridaAceita.UIDCliente,this.dadosCorridaAceita)
  .then((res)=>{
    this.loadindFinalizarCorrida = false;
    this.mostrarMenuInfoCorrida();
    this.notificacaoProximidadeDestinoFinal = false;
  });
}

public retornaHoraDataFormatadaAtual():string{ 
  return `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
}

public calculaValorDividaMaisCorridaOfertaCliente():number{
  return parseFloat(this.dadosCorridaAceita.propostaClienteValor.valor) + parseFloat(this.dadosCorridaAceita.saldoDevedorCliente);
}
public calculaDividaMaisCorridaContraProposta():number{
  return parseFloat(this.dadosCorridaAceita.contraPropostaMotorista.valor) + parseFloat(this.dadosCorridaAceita.saldoDevedorCliente);
}

}

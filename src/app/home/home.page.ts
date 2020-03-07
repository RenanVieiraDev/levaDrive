import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  Environment,
  MyLocation,
  GoogleMapsAnimation,
  Geocoder
} from '@ionic-native/google-maps';
import * as firebase from 'firebase';
import { Component,ViewChild, OnInit,NgZone, ɵConsole } from '@angular/core';
import {Platform,LoadingController} from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {Cadastros} from '../shared/services/cadastros.service';
import {GetRealTimeDados} from '../shared/services/getSetRealTimeDados.service';
import { FormGroup, FormControl } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { async } from '@angular/core/testing';
declare var google:any;

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


//app motorista
private corridasNotificacoes=[];
private corridasFinalizadas=[];
private corridasRecusadas=[];
private painel = 'corridas'; //existe três painel (corridas),(dashboard) e (mapa);
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
    public alertController: AlertController
    ) {}

  async ngOnInit(){
    this.urlImagemPerfilMotorista = await this.realTime.pegaImagemPerfilMotorista();
    //inicialização do modo online
    this.inicializacaoDoModoOnline({
      minhaLocalizacao:await this.minhaLocalizacao(),
      online: new Date().getTime()
    });
    setInterval(async ()=>{
      this.inicializacaoDoModoOnline({
        minhaLocalizacao:await this.minhaLocalizacao(),
        online: new Date().getTime()
      });
    },2500*60);
  }

  public inicializacaoDoModoOnline(...params):void{
    //if(this.aconpanhandoOChat === 'off')this.aconpanhaChat(`motoristas/${localStorage.getItem('UID')}/chat/`);
    if(this.aconpanhandoCorridas === 'off')this.aconpanhaCorridas(`motoristas/${localStorage.getItem('UID')}/corridas/`);
    this.cadastro.alteraValorOnline(localStorage.getItem('UID'),params[0].online);
    this.cadastro.alteraLocalizacao(localStorage.getItem('UID'),params[0].minhaLocalizacao);
  }

  async minhaLocalizacao(){
    let watch = await this.geolocation.getCurrentPosition({enableHighAccuracy :  true });
    let meuLOcal = {lat:watch.coords.latitude,lng:watch.coords.longitude}
    return meuLOcal;
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
        if(this.corridaIniciadaOn === 'off'){
          this.dadosCorridaAceita = corridaSnapshot.val()[key];
          this.corridaIniciadaOn = 'on';
          console.log('Verifique se tem mais pedidos e negue todos');
          this.painel = 'mapa';
          this.mapaElement = this.mapaElement.nativeElement;
          this.mapaElement.style.width = this.plataforma.width()+'px';
          this.mapaElement.style.height = this.plataforma.height()+'px';
          this.mapaElement.style.background = 'red';
          this.loadMap(corridaSnapshot.val()[key].UIDCliente,{usuario:corridaSnapshot.val()[key].localClienteCords,destino:corridaSnapshot.val()[key].destinoCords});
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
        if(this.corridaIniciadaOn === 'off'){
          this.dadosCorridaAceita = corridaSnapshot.val()[key];
          this.corridaIniciadaOn = 'on';
          console.log('Verifique se tem mais pedidos e negue todos');
          this.painel = 'mapa';
          this.mapaElement = this.mapaElement.nativeElement;
          this.mapaElement.style.width = this.plataforma.width()+'px';
          this.mapaElement.style.height = this.plataforma.height()+'px';
          this.mapaElement.style.background = 'red';
          this.loadMap(corridaSnapshot.val()[key].UIDCliente,{usuario:corridaSnapshot.val()[key].localClienteCords,destino:corridaSnapshot.val()[key].destinoCords});
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
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyB1rryHAFIWcdcsCqxxiu7X1INYI9nXexQ',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyB1rryHAFIWcdcsCqxxiu7X1INYI9nXexQ'
    });

    let mapOptions: GoogleMapOptions = {
      controls:{
        zoom:false
      }
    };
    this.map = GoogleMaps.create(this.mapaElement,mapOptions);

    try{
      let watch = await this.geolocation.getCurrentPosition({enableHighAccuracy :  true });
    let localizacaoAtual ={lat:watch.coords.latitude,lng:watch.coords.longitude};
      await this.map.one(GoogleMapsEvent.MAP_READY);
      this.addOriginMaker(localizacaoAtual);
      this.adicionarMakerNoMapa(
        {makerNome:'Usuario',cor:'rgb(0,0,0)',localizacao:localizacoes[0].usuario},
        {makerNome:'Destino',cor:'rgb(30,144,255)',localizacao:localizacoes[0].destino});
      this.calcRotaMotoristaClienteDestino(
        {quem:'Motorista',localizacao:localizacaoAtual},
        {quem:'Usuario',localizacao:localizacoes[0].usuario},
        {quem:'Destino',localizacao:localizacoes[0].destino});
      this.aconpanhaAproximacaoDoUsuarioComMotorista(uidCliente);
    
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
        this.presentAlertSystem('Error',err.code,err.message);
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
            
            })
        
   } 

   async aconpanhaAproximacaoDoUsuarioComMotorista(uidCliente){
      let verificaLocal  = setInterval(async ()=>{
        let localUsuario = await this.realTime.pegaLocalCliente(uidCliente);
        let distancia = await this.calculaDistEntreDoisPontos(localUsuario);
        if(distancia < 100){
          this.aconpanhaAproximacaoDoDestinoFinal(uidCliente);
          pararContagem();
        }
      },1000*30);
      function pararContagem(){
        clearInterval(verificaLocal);
      }
    }

    async aconpanhaAproximacaoDoDestinoFinal(uidCliente){
      let verificaLocal  = setInterval(async ()=>{
        console.log('aconpanhando destino final');
        let localDestino = await this.realTime.pegaLocalDestinoFinal(uidCliente);
        let distancia = await this.calculaDistEntreDoisPontos(localDestino);
        console.log(distancia);
        if(distancia < 100){
          pararContagem();
        }
      },1000*10);
      function pararContagem(){
        clearInterval(verificaLocal);
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

  async presentAlertCancelarCorrida(titulo,msg) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msg,
      buttons: [
        {
          text: 'Não',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {}
        }, {
          text: 'Sim',
          handler: () => {
            this.atualizaSaldoEmConta('cancelamento');
            this.back();
            this.removeConexao(this.pathDoChat);
            this.removeConexao(this.pathDaCorrida);
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

public atualizaSaldoEmConta(acao):void{
    this.realTime.pegaSaldoEmConta()
    .then(saldo=>{
      if(acao==='cancelamento'){
        this.cadastro.cadastraSaldoEmConta((saldo - (this.dadosCorridaAceita.valorCorrida/2)).toFixed(2));
      }
    })
    .catch(err=>{
      this.presentAlertSystem('Erro',err.code,err.message);
    });
}



}

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
private search = '';
private googleAutoComplit = new google.maps.places.AutocompleteService();
private origenMaker:Marker;
private destination:any;
private resultadosDePesquisa = new Array;
private googleDirectionServices = new google.maps.DirectionsService();
private corridaViewMenu={nomeLocal:'',distancia:'',duracao:'',valorCorrida:'',ondeEstou:''};
private pedidoDeCorrida:any;
private pedidoCorridaIniciada = '';
private listaContatosMotoristasOn=[];
private msgEnvioChat = new FormGroup({msgSend:new FormControl(null)});
private aconpanhandoOChat:string = 'off';
private conversaChat = [];
private menuBotoesCorridaAtiva:boolean = false;
private pathDaCorrida:any;
private pathDoChat:any;
private classificacaoMotorista:boolean = false;
private totalEstrelasParaMotorista:number;
private comentarioClassificacaoMotorista = new FormGroup({'comentario':new FormControl(null)});
private dadosFormPropostaCliente = new FormGroup({'valor':new FormControl(null)});
private contraPropostaAtiva:boolean = false;

  constructor(
    public plataforma:Platform,
    public loadingCtl:LoadingController,
    private geolocation: Geolocation,
    private zone:NgZone,
    public cadastro:Cadastros,
    public realTime:GetRealTimeDados,
    public alertController: AlertController
    ) {}

  ngOnInit(){
    this.mapaElement = this.mapaElement.nativeElement;
    this.mapaElement.style.width = this.plataforma.width()+'px';
    this.mapaElement.style.height = this.plataforma.height()+'px';
    this.mapaElement.style.background = 'red';
    this.loadMap();
  }

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


 async loadMap(){
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
      await this.map.one(GoogleMapsEvent.MAP_READY)
      this.addOriginMaker();
    }catch(err){
      this.presentAlertSystem('Error',err.code,err.message);
    }

  }

  async  addOriginMaker(){
    let watch = await this.geolocation.getCurrentPosition({enableHighAccuracy :  true });
    let localizacaoAtual ={lat:watch.coords.latitude,lng:watch.coords.longitude};
       try{
          this.map.moveCamera({
          target:localizacaoAtual,
          zoom:18
        });
        this.origenMaker = this.map.addMarkerSync({
          title: 'Eu',
          icon: '#000',
          animation: GoogleMapsAnimation.DROP,
          position:localizacaoAtual
        });

      }catch(err){
        this.presentAlertSystem('Error',err.code,err.message);
      }finally{
        this.loading.dismiss();
        this.search="";
      }
  }

  searchChanged(){
    if(!this.search.trim().length)return;
    if(!this.search)this.resultadosDePesquisa=[];
    this.googleAutoComplit.getPlacePredictions({input:this.search},prediction=>{
      this.zone.run(()=>{
        this.resultadosDePesquisa = prediction;
      });
   })
  }

  async calcRota(pesquisa){
    this.pedidoCorridaIniciada='';
    this.corridaViewMenu={nomeLocal:'',distancia:'',duracao:'',valorCorrida:'',ondeEstou:''};
    this.resultadosDePesquisa = [];
   this.destination = pesquisa;
   const info = await Geocoder.geocode({address:this.destination.description})
  let markerDestinations:Marker= this.map.addMarkerSync({
    title:this.destination.description,
    icon:'#000',
    animation:GoogleMapsAnimation.DROP,
    position:info[0].position
  });
  this.googleDirectionServices.route({
    origin:this.origenMaker.getPosition(),
    destination:markerDestinations.getPosition(),
    travelMode:'DRIVING'},
      result=>{
        const points = new Array;
        let router = result.routes[0].overview_path;
        for(let i=0;i<router.length;i++){
          points[i] ={
            lat:router[i].lat(),
            lng:router[i].lng()
          }
        }
        this.map.addPolyline({
          points:points,
          color:'#000',
          width:3
        })
        this.map.moveCamera({target:points});
        this.map.panBy(0,100);
        this.calculaValorCorrida(info[0].position,this.destination.description);
      })
  } 

  async back(){
    this.pedidoCorridaIniciada='';
    this.corridaViewMenu={nomeLocal:'',distancia:'',duracao:'',valorCorrida:'',ondeEstou:''};
    try{
      await this.map.clear();
      this.destination=null;
      this.addOriginMaker();
    }catch(err){
      this.presentAlertSystem('Error',err.code,err.message);
    }
  }

  async calculaValorCorrida(ltdLgnDestino,descricaoDestino){
    this.pedidoCorridaIniciada='pedidoFase1';
  //base 2.50//minima 5.50//por km 2.00//por minuto 0.50
    const base=2.50,fixo=0.75,minima=5.50,porKm=2.00,porMinuto=0.50;
    var service = new google.maps.DistanceMatrixService();
    await service.getDistanceMatrix(
      {
        origins: [this.origenMaker.getPosition()],
        destinations: [ltdLgnDestino],
        travelMode: 'DRIVING',
        avoidHighways: true,
        avoidTolls: true,
      }, result=>{
        let valorPorKm = Math.ceil((porKm/1000)*result.rows[0].elements[0].distance.value)
        let valorPorMinuto = Math.ceil((porMinuto/60)*result.rows[0].elements[0].duration.value)
        let valorTotalCorrida = (base+fixo)+(valorPorMinuto+valorPorKm);
        if(valorTotalCorrida < minima) valorTotalCorrida = minima;
        this.zone.run(()=>{
          this.corridaViewMenu = {
            nomeLocal:descricaoDestino,
            distancia:result.rows[0].elements[0].distance.text,
            duracao:result.rows[0].elements[0].duration.text,
            valorCorrida:valorTotalCorrida.toFixed(2),
            ondeEstou:''
            };
          this.pedidoDeCorrida ={
            nomeCliente:null,
            localClienteCords:this.origenMaker.getPosition(),
            destinoCords:ltdLgnDestino,
            UIDCliente:localStorage.getItem('UID'),
            destinoNome:descricaoDestino,
            dataHoraPedido:this.cadastro.retornaHoraDataAtual(),
            pedidoAceito:false,
            motoristaUID:'',
            motoristaNome:'',
            localAtualMotorista:'',
            pedidoNegadoPor:['1'],
            distancia:result.rows[0].elements[0].distance.text,
            duracao:result.rows[0].elements[0].duration.text,
            valorCorrida:valorTotalCorrida.toFixed(2),
            statusDeCorrida:'aguardando', //3 estados:(aguardando),(iniciada),(finalizada)
            propostaClienteValor:{valor:'',propostaAceita:''},
            contraPropostaMotorista:{valor:'',contraPropostaAceita:''},
          };
        });
      });
  }

  public pedirCorrida():void{
    this.pedidoDeCorrida.propostaClienteValor.valor = this.dadosFormPropostaCliente.value.valor === null ? this.pedidoDeCorrida.valorCorrida : (this.dadosFormPropostaCliente.value.valor).toFixed(2);
    let percentualMedio = this.pedidoDeCorrida.valorCorrida - ((this.pedidoDeCorrida.valorCorrida * 40)/100);
    if(this.dadosFormPropostaCliente.value.valor >= percentualMedio){
        this.pedidoCorridaIniciada='aguardando';
        this.realTime.getListaMotoristaOnlines()
        .then(resposta=>{
          //rankear motorista por proximidade
          let proximidadeMotoristas=[],organizaRankMoto=[],tempoParaExecutar=0,rankOrganizadoMotorista=[];
          for(let key in resposta ){
          this.calculaDistEntreDoisPontos(resposta[key].localAtual)
          .then(res=>{
            organizaRankMoto.push(res);
            proximidadeMotoristas.push({distanciaM:res,dadosMotorista:resposta[key]});
            tempoParaExecutar++;
            if(tempoParaExecutar === resposta.length){
                let x = 0;  
              organizaRankMoto.sort()

                while(x < organizaRankMoto.length){
                  for(let key=0;key < proximidadeMotoristas.length;key++){
                  if(organizaRankMoto[x] === proximidadeMotoristas[key].distanciaM){
                    rankOrganizadoMotorista[x] = proximidadeMotoristas[key];
                    break;
                  }
                  }
                  x++;
                }
                this.listaContatosMotoristasOn=rankOrganizadoMotorista;
                this.notificaPedidoParaMotorista();
            }
          })
          }
        })
        .catch(err=>{
          this.presentAlertSystem('Error',err.code,err.message);
        })
    }else{
      this.presentAlertSystem('Aviso!','estimativa de valor.',`Estimativa aproximada do sistema R$${this.pedidoDeCorrida.valorCorrida}. Para melhorar sua oferta, ofereça um valor proximo do valor que o sistema indicou`);
    }

   
  }

  public calculaDistEntreDoisPontos(localMoto):Promise<any>{
    return new Promise<any>((resolve,reject)=>{
      var service = new google.maps.DistanceMatrixService();
     service.getDistanceMatrix(
      {
        origins: [this.origenMaker.getPosition()],
        destinations: [localMoto],
        travelMode: 'DRIVING',
        avoidHighways: true,
        avoidTolls: true,
      }, result=>{
        resolve(result.rows[0].elements[0].distance.value);
      });
    })
  }

  public notificaPedidoParaMotorista():void{
    if(this.listaContatosMotoristasOn.length > 0){    
      let totalMotoristasListados=0;
      for(let key in this.listaContatosMotoristasOn){
        if(this.pedidoDeCorrida.pedidoNegadoPor.indexOf(this.listaContatosMotoristasOn[key].dadosMotorista.UIDMotorista) === -1){
          //'cadastrar pedido da corrida no DB do motorista'
          this.cadastro.cadastrarPedidoCorrida(this.listaContatosMotoristasOn[key],this.pedidoDeCorrida)
          .then((res)=>{
            //'comece a escultar o pedido'
            this.pathDaCorrida = res;
            this.aconpanhaPedidoCorrida(res);
          })
          .catch((err)=>{
            this.presentAlertSystem('erro!',err.code,err.message);
          });
          break;
        } //fim do if <<
        totalMotoristasListados++;
      }
      if(totalMotoristasListados ===  this.listaContatosMotoristasOn.length){
        this.pedidoCorridaIniciada='';
        this.presentAlertConfirm('Motorista indisponivel','Não a motoristas disponiveis no momento, aguarde e tente novamente daqui a uns minutos!');
      };
    }else{
      this.pedidoCorridaIniciada='';
      this.presentAlertConfirm('Sem proximidade','não existe motoristas nas proximidades no momento,por favor tente mais tarde!');
    }
    
  }
  
  public aconpanhaPedidoCorrida(pathPedido):void{
    let makerListParaRemocao:Array<any>= [''];
     firebase.database().ref(pathPedido)
      .on('value', corridaSnapshot=> {

      if(corridaSnapshot.val().propostaClienteValor.propostaAceita === 'ok' ||
      corridaSnapshot.val().contraPropostaMotorista.contraPropostaAceita === 'ok'
      ){
        this. atualizaInformacaoDoPedidoCorrida(corridaSnapshot.val());
        this.contraPropostaAtiva = false;
        this.pedidoCorridaIniciada = '';
        if(makerListParaRemocao[0])makerListParaRemocao[0].remove();
        const MARCADO = this.map.addMarkerSync({
          title: 'Mototrista',
          icon:'../../assets/icon/icons8-fiat-500-48.png',
          animation:GoogleMapsAnimation.DROP,
          //position:{lat: -8.4148556, lng: -37.0500923}
          position:corridaSnapshot.val().localAtualMotorista
        });

        this.pedidoCorridaIniciada = 'ok';
        makerListParaRemocao[0]=MARCADO;

        //verifica status da corrida
        if(this.pedidoDeCorrida.statusDeCorrida === 'finalizada'){
          this.classificacaoMotorista = true;
          this.pedidoCorridaIniciada = '';
        };

      }else if(corridaSnapshot.val().propostaClienteValor.propostaAceita === 'contraProposta'){
        this.contraPropostaAtiva = true;
        this.pedidoCorridaIniciada = '';
        if(corridaSnapshot.val().contraPropostaMotorista.contraPropostaAceita === 'nao'){
          this.contraPropostaAtiva = false;
          this.pedidoCorridaIniciada = 'aguardando';
          this.pedidoDeCorrida.pedidoNegadoPor.push(corridaSnapshot.val().motoristaUID);
          this.notificaPedidoParaMotorista();
          this.removeConexao(pathPedido);
        }
      }else if(corridaSnapshot.val().propostaClienteValor.propostaAceita === 'nao'){
        this.contraPropostaAtiva = false;
        this.pedidoCorridaIniciada = 'aguardando';
        this.pedidoDeCorrida.pedidoNegadoPor.push(corridaSnapshot.val().motoristaUID);
        this.notificaPedidoParaMotorista();
        this.removeConexao(pathPedido);
      }
    });
  }

  public atualizaInformacaoDoPedidoCorrida(info){
     //armazenando dados atualizados do pedido pelo motorista
     this.pedidoDeCorrida = info
     console.log(this.pedidoDeCorrida);
  }

  public abrirFecharChat():void{
    let chat = document.querySelector('#chatId');

    if ((chat.className).indexOf('off') === -1){
      chat.className = 'chatFiltro off';
    }else {
      chat.className = 'chatFiltro';
    }
    if(this.aconpanhandoOChat === 'off'){
      this.pathDoChat = `motoristas/${this.pedidoDeCorrida.motoristaUID}/chat/${localStorage.getItem('UID')}/`;
      this.atualizaChatMsgs(`motoristas/${this.pedidoDeCorrida.motoristaUID}/chat/${localStorage.getItem('UID')}/`);
    }
    this.moveScrollBottom('telaId');
  }

  public enviarMsgChat():void{
    if(this.msgEnvioChat.value.msgSend !== null){
      this.realTime.setMsgChat(this.pedidoDeCorrida.motoristaUID,this.msgEnvioChat.value.msgSend)
      .then((resPath)=>{})
      .catch((err)=>{
        this.presentAlertSystem('Error',err.code,err.message);
      })
      this.msgEnvioChat.reset()
    }
  }

  public atualizaChatMsgs(pathChatAtual):void{
    firebase.database().ref(pathChatAtual)
    .on('value',chatMsgSnapshot=>{
      this.conversaChat = [];
      for(let key in chatMsgSnapshot.val()){
        //msgVoce //msgMotorista
        let Classe = chatMsgSnapshot.val()[key].de === localStorage.getItem('UID') ? 'msgVoce':'msgMotorista';
        let de = chatMsgSnapshot.val()[key].de === localStorage.getItem('UID') ? 'Você':this.pedidoDeCorrida.motoristaNome;
        this.conversaChat.push({deQuem:de,nomeClasse:Classe,dadosMsg:chatMsgSnapshot.val()[key]});
      }
      this.aconpanhandoOChat = 'false';
      this.aconpanhandoOChat = 'on';
      this.moveScrollBottom('telaId');
    },
    err=>{console.log(err)}
    );
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

public openMenuBotoesCorridaAtiva():void{
  this.menuBotoesCorridaAtiva = this.menuBotoesCorridaAtiva===false?true:false;
}

public cancelarCorrida():void{
  this.openMenuBotoesCorridaAtiva();
  this.presentAlertCancelarCorrida('Atenção!','Você deseja realmente cancelar a corrida? o valor da metade da corrida será cobrado.');
}

public atualizaSaldoEmConta(acao):void{
    this.realTime.pegaSaldoEmConta()
    .then(saldo=>{
      if(acao==='cancelamento'){
        this.cadastro.cadastraSaldoEmConta((saldo - (this.pedidoDeCorrida.valorCorrida/2)).toFixed(2));
      }
    })
    .catch(err=>{
      this.presentAlertSystem('Erro',err.code,err.message);
    });
}

 public darPontuacaoMotorista():void{
   this.cadastro.cadastrarEstrelasParaMotorista(this.pedidoDeCorrida.motoristaUID,this.totalEstrelasParaMotorista,this.comentarioClassificacaoMotorista.value.comentario) 
   .then(()=>{
    this.removeConexao(this.pathDaCorrida);
    this.removeConexao(this.pathDoChat);
    this.back();
    this.classificacaoMotorista=false
   })
   .catch(err=>{});
 }

 public efeitoEstrela(numeroEstrelas):void{
   let totalEstrelasMarcadas = 0
    for(let y=1;y<=5;y++){
      let estrela = document.querySelector('#est'+y);
      if(y <= numeroEstrelas){
        totalEstrelasMarcadas++;
        estrela.setAttribute('src','../../assets/icon/estrelaCheia.png');
      }else if(y > numeroEstrelas){
        estrela.setAttribute('src','../../assets/icon/estrelaVazia.png');
      }
    }
    this.totalEstrelasParaMotorista = totalEstrelasMarcadas
 }

}

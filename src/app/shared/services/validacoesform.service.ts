export class ValidacoesForm{
    public validarFormularioCadastroMotorista(dadosForm,imagens):Promise<any>{
        //resolve 0 === ok;//REJECT > / 1 nome /2 sexo / 3 data nascimento / 4 CPF /5 EMAIL/ 6 SENHA; 7 placa
        //8 imagem perfil /9 imagem CNH/ 10 imagem Veiculo
        return new Promise<number>((resolve,reject)=>{
            if(!this.valoresVazios(dadosForm.nome))reject(1);
            if(!this.valoresVazios(dadosForm.sexo))reject(2);
            if(!this.valoresVazios(dadosForm.dataNascimento))reject(3);
            if(!this.testeCpf(dadosForm.cpf))reject(4);
            if(!this.testeEmail(dadosForm.email))reject(5);
            if(!this.testeSenha(dadosForm.senha,dadosForm.confSenha))reject(6);
            if(!this.validaPlacaVeiculo((dadosForm.placa).toUpperCase()))reject(7);
            if(!this.verifiraSeAImagem(imagens[0].arquivo))reject(8);
            if(!this.verifiraSeAImagem(imagens[1].arquivo))reject(9);
            if(!this.verifiraSeAImagem(imagens[2].arquivo))reject(10);
            resolve(0)
        });
    }

    public testeEmail(email):boolean{
        let regex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        return regex.test(email);
    }

    public testeSenha(senha,confSenha):boolean{
        if(senha === null || confSenha === null)return false;
        if(senha !== confSenha)return false;
        if(senha.length < 8)return false;
        return true;
    }

    public testeCpf(cpf):boolean{
        const CPFFORMA = new RegExp(/^[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2}$/);
        return CPFFORMA.test(cpf);
    }

    public valoresVazios(valor):boolean{
        if(valor !== null && valor.length >= 4)return true;
        return false;
    }
    public verifiraSeAImagem(arquivo){
        if(arquivo != null ){
            if(arquivo.size > 0){
                return true;
            }else{
                return false;
            }
        }
        return false;
    }

    public validaPlacaVeiculo(entradaPlaca):boolean{
        let regex = new RegExp("^[A-Z]{3}[0-9]{4}$");
        return regex.test(entradaPlaca);
    }

    public tradutorCode(msgCode):string{
        switch(msgCode){
            case "auth/weak-password":
                return "A senha não é forte o suficiente."
            case "auth/operation-not-allowed":
                return "Se as contas de email / senha não estiverem ativadas. Ative as contas de email / senha."
            case "auth/email-already-in-use":
                return "Já existir uma conta com o endereço de email fornecido."
            case "auth/wrong-password":
                return "A senha está incorreta!"
            case "auth/invalid-email":
                return "Email invalido! verifique o email e tente novamente."
            case "auth/user-not-found":
                return "Usuario não existe! cadastre-se para entrar."
            case "auth/network-request-failed":
                return "falha na solicitação de rede! verifique se você está conectado a internet."
            default:
                return `Ouve um problema inesperado! por favor entrar em contato com o suporte
                        no site www.azure.com.br.`
        }
    }

}
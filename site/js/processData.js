/*
* @requires XLSX
* @requires jQuery as $
* @requires alertify
* @requires saveAs from FileSaver
*/

"use strict"
var ConversorUTILS = function(){
	return{
		isASCII : function(str) {
    		return /^[\x00-\x7F]*$/.test(str);
		}
	}
}();

var ConversorDados = (function(){
	var self = this;
	//CACHE DOM
	var $tipo = $("#tipo"); 
	var $versao = $("#versao"); 
	var $codigoCondominio = $("#codigo-condominio");
	var $dataLeitura = $("#data-leitura");
	var $mes = $("#mes");
	var $ano = $("#ano");

	var $dropPlanilha = $("#drop-planilha");
	var $salvarConfiguracao = $("#salvar-configuracao");
	var $importarConfiguracao = $("#importar-configuracao");
	var $fileImportarConfiguracao = $("#importar-configuracao :file");
	var workbook = undefined;
	var config = undefined;
	//Bind Events
	function _handleDrop(e) {
		e.stopPropagation();
		e.preventDefault();
		var files = e.dataTransfer.files;
		var i,f;
		for (i = 0, f = files[i]; i != files.length; ++i) {
			var reader = new FileReader();
			var name = f.name;
			reader.onload = function(e) {
			    console.log("Start ... ");
				// alertify.alert("Strating Excel Processing ");
				var data = e.target.result;
				var cfb, wb;
				function doit(){
				   try{
						var arr = String.fromCharCode.apply(null, new Uint8Array(data));
						var wb = XLSX.read(btoa(arr), {type: 'base64'});
						workbook = wb;
				   } catch(e){
				      console.log(e, e.stack);
				      return mostrarMensagemErro("Um erro ocorreu durante a leitura do arquivo.");
				   }
				   console.log("Stop....");
				}
				//if (data.length > 500000) alertify.confirm("This file is " + data.length + "bytes and may take few moments. Your browser may lock up during this process. Shall we proceed?",function(e){ if(e) doit(); else console.log("Stop ...");}); 
				//else { doit(); console.log("Stop....");}
				doit();
			};
			reader.readAsArrayBuffer(f);
		}
	}

	function _handleDragover(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}

	if($dropPlanilha.get(0).addEventListener) {
		$dropPlanilha.get(0).addEventListener('dragenter', _handleDragover, false);
		$dropPlanilha.get(0).addEventListener('dragover', _handleDragover, false);
		$dropPlanilha.get(0).addEventListener('drop', _handleDrop, false);
	}

	$(document).on('change','.btn-file :file',function(){
		var input = $(this);
		var numFiles = input.get(0).files ? input.get(0).files.length : 1;
		var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect',[numFiles,label]);
	});

	$fileImportarConfiguracao.on('fileselect',function(event,numFiles,label){
		if(numFiles < 1){
			return mostrarMensagemErro("Nenhum arquivo foi selecionado.");
		}
		else{
			console.log(this);
			var file = this.files[0];
			var reader = new FileReader();
			reader.onload = function(){
				try{
					config = JSON.parse(reader.result);
				}
				catch(err){
					return mostrarMensagemErro("A configuração a ser importada é inválida.");
				}

				$tipo.val(config["tipo"]);
				$versao.val(config["versao"]);
				$codigoCondominio.val(config["codigoCondominio"]);
				$dataLeitura.val(config["dataLeitura"]);
				$mes.val(config["mes"]);
				$ano.val(config["ano"]);
			}
			reader.readAsText(file);
		}
	});

	//Inner functions
	function mostrarMensagemErro(mensagem){
		alertify.alert(mensagem);
	}

	function getValorBloco(celulaBloco,localizacao){
		if(celulaBloco == undefined || celulaBloco.w === ""){
			mostrarMensagemErro("Ocorreu um erro ao processar a solicitacao em: "+ localizacao);
			throw "Erro em: " + localizacao;
		}
		var valorBloco = celulaBloco['w'].replace('Bloco').trim();
		if(valorBloco.length > 4){
			mostrarMensagemErro("Ocorreu um erro em :"+localizacao+", o bloco possui mais de 4 caracteres.");
			throw "Erro em : " + localizacao;
		}
		else{
			return valorBloco;
		}
	}

	function getNumeroApartamento(celulaApartamento,localizacao){
		if(celulaApartamento == undefined || celulaApartamento.w === ""){
			mostrarMensagemErro("Ocorreu um erro ao processar a solicitacao em : "+ localizacao);
			throw "Erro em: "+localizacao;
		}
		var valorApartamento = celulaApartamento['w'].trim();
		if(valorApartamento.length > 6){
			mostrarMensagemErro("Ocorreu um erro em :"+localizacao+", o apartamento possui mais de 6 caracteres.");
			throw "Erro em: "+localizacao;
		}
		else{
			return valorApartamento;
		}
	}

	function getValorLeituraAnterior(celulaLeituraAtual,localizacao){
		
	}

	function getValorLeituraAtual(celulaLeituraAtual,localizacao){

	}

	function getValorConsumo(celulaConsumo,localizacao){

	}

	function getValor(celulaValor,localizacao){

	}

	return {
	    buildConfig : function(){
			var config = {};
			config.tipo = $tipo.val();
			config.versao = $versao.val();
			config.codigoCondominio = $codigoCondominio.val();
			config.dataLeitura = $dataLeitura.val();
			config.mes = $mes.val();
			config.ano = $ano.val();

			if(!this.validarFormulario(config)){
				return config;
			}
			else{
				throw "O formulário contém erros de preenchimento.";
			}
		},

		validarFormulario : function(config){
			var contemErros = false;
			resetarCampos();
			//TIPO
			var tipo = config.tipo;
			if(tipo == undefined || tipo === "" || !ConversorUTILS.isASCII(tipo) || tipo.length > 10){
				invalidarCampo($tipo);
				contemErros = true;
			}
			else{
				validarCampo($tipo);
			}
			//VERSAO
			var versao = config.versao;
			if(versao == undefined || versao === "" || isNaN(versao) || versao.length > 2){
				invalidarCampo($versao);
				contemErros = true;
			}
			else{
				validarCampo($versao);
			}
			//CODIGO CONDOMINO
			var codigoCondominio = config.codigoCondominio;
			if(codigoCondominio == undefined || codigoCondominio === "" || isNaN(codigoCondominio || codigoCondominio > 4)){
				invalidarCampo($codigoCondominio);
				contemErros = true;
			}
			else{
				validarCampo($codigoCondominio);
			}
			//DATA LEITURA
			var dataLeitura = config.dataLeitura;
			if(dataLeitura == undefined || dataLeitura === ""){
				invalidarCampo($dataLeitura);
				contemErros = true;
			}
			else{
				validarCampo($dataLeitura);
			}
			//MES
			var mes = config.mes;
			if(mes == undefined || mes === ""){
				invalidarCampo($mes);
				contemErros = true;
			}
			else{
				validarCampo($mes);
			}
			//ANO
			var ano = config.ano;
			if(ano == undefined || ano === ""){
				invalidarCampo($ano);
				contemErros = true;
			}
			else{
				validarCampo($ano);
			}

			function resetarCampos(){
				$(".invalido").removeClass("invalido");
			}

			function invalidarCampo($elemento){
				if($elemento instanceof jQuery){
					$elemento.removeClass("valido").addClass("invalido");
				}
			}

			function validarCampo($elemento){
				if($elemento instanceof jQuery){
					$elemento.removeClass("invalido").addClass("valido");
				}
			}

			return contemErros;
		},

		gerarArquivo : function(){
			//Build Config
			try{
				config = this.buildConfig();
			}
			catch(err){
				return mostrarMensagemErro(err);
			}
			//Get Workbook
			if(workbook == undefined){
				return mostrarMensagemErro("É necessário fazer upload de um arquivo .xlsx.");
			}

			if(workbook.SheetNames.length < 1){
				return mostrarMensagemErro("O arquivo não possui planilhas criadas.");
			}
			
			sheet = workbook.Sheets[workbook.SheetNames[0]]
			//Erro Interno da Biblioteca
			if(sheet == undefined){
				return mostrarMensagemErro("Um erro ocorreu ao processar o arquivo.")
			}	

			var localizacaoDoPrimeiroBloco = "A10";
			var offsetBlocoApartamento = 3;
			var linhaAtual = 10;
			var celulaBloco = sheet[localizacaoDoPrimeiroBloco]
			if(celulaBloco == undefined){
				return mostrarMensagemErro("A planilha não contém um bloco na localização A10");
			}

			while(celulaBloco != undefined){
				try{
					config["bloco"] = getValorBloco(celulaBloco);
				}
				catch(err){
					return;
				}


				var celulaBloco = sheet["A" + linhaAtual]; 
			}
		},	

		salvarConfiguracao : function(){
			//Build Config
			try{
				var config = this.buildConfig();
			}
			catch(err){
				return mostrarMensagemErro(err);
			}
			var blob = new Blob([JSON.stringify(config)], {type: "text/plain;charset=utf-8"});
			saveAs(blob, "configuracao.cfg");
		},
	}
}());


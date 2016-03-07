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
		},
		isNumeric : function(str){
			return !isNaN(parseFloat(str)) && isFinite(str);
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
	var $planilhaInfo = $("#planilha-info");
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
				   $planilhaInfo.text(name);
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

	function getBloco(celulaBloco,localizacao){
		if(celulaBloco == undefined || celulaBloco.w === ""){
			mostrarMensagemErro("Ocorreu um erro ao processar a solicitacao em: "+ localizacao);
			throw "Erro em: " + localizacao;
		}
		var valorBloco = celulaBloco['w'].replace('Bloco',"").trim();
		if(valorBloco.length > 4){
			mostrarMensagemErro("Ocorreu um erro em :"+localizacao+", o bloco possui mais de 4 caracteres.");
			throw "Erro em : " + localizacao;
		}
		else{
			return valorBloco;
		}
	}

	function getUnidade(celulaUnidade,localizacao){
		if(celulaUnidade == undefined || celulaUnidade.w === ""){
			mostrarMensagemErro("Ocorreu um erro ao processar a solicitacao em : "+ localizacao);
			throw "Erro em: "+localizacao;
		}
		var valorUnidade = celulaUnidade['w'].trim();
		if(valorUnidade.length > 6){
			mostrarMensagemErro("Ocorreu um erro em :"+localizacao+", o apartamento possui mais de 6 caracteres.");
			throw "Erro em: "+localizacao;
		}
		else{
			return valorUnidade;
		}
	}

	function getValorNumerico(celula,localizacao){
		if(celula == undefined || celula.w === ""){
			mostrarMensagemErro("Ocorreu um erro ao processar a solicitacao em : "+ localizacao);
			throw "Erro em: "+localizacao;
		}

		if(celula['t'] !== "n" || !ConversorUTILS.isNumeric(celula['w'])){
			mostrarMensagemErro("Era esperado um valor numérico em: "+localizacao);
			throw "Erro em: " + localizacao;
		}
		else{
			var valorNumerico = celula['w'].trim();	
			return valorNumerico;
		}
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
			var data = "";
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
			
			var sheet = workbook.Sheets[workbook.SheetNames[0]]
			//Erro Interno da Biblioteca
			if(sheet == undefined){
				return mostrarMensagemErro("Um erro ocorreu ao processar o arquivo.")
			}	
			var localizacaoBloco = "A10";
			var offsetBlocoApartamento = 3;
			var linhaAtual = 10;
			var celulaBloco = sheet[localizacaoBloco]
			if(celulaBloco == undefined){
				return mostrarMensagemErro("A planilha não contém um bloco na localização A10");
			}

			while(celulaBloco != undefined){
				try{
					config["bloco"] = getBloco(celulaBloco,localizacaoBloco);
				}
				catch(err){
					break;
				}

				linhaAtual += offsetBlocoApartamento;

				//Loops Apartamentos
				do{
					var localizacaoUnidade = "A"+linhaAtual;
					var localizacaoMedicaoAnterior = "B" + linhaAtual;
					var localizacaoMedicaoAtual = "C" + linhaAtual;
					var localizacaoConsumo = "D" + linhaAtual;
					var localizacaoValor = "F" + linhaAtual;

					var celulaUnidade = sheet[localizacaoUnidade];
					var celulaMedicaoAnterior = sheet[localizacaoMedicaoAnterior];
					var celulaMedicaoAtual = sheet[localizacaoMedicaoAtual];
					var celulaConsumo = sheet[localizacaoConsumo];
					var celulaValor = sheet[localizacaoValor];
					
					//Condicao de Parada
					if(celulaUnidade === undefined || celulaUnidade == ""){
						break;
					}

					try{
						config["unidade"] = getUnidade(celulaUnidade,localizacaoUnidade);
						config["leituraAnterior"] = getValorNumerico(celulaMedicaoAnterior,localizacaoMedicaoAnterior);
						config["leituraAtual"] = getValorNumerico(celulaMedicaoAtual,localizacaoMedicaoAtual);
						config["consumo"] = getValorNumerico(celulaConsumo,localizacaoConsumo);
						config["valor"] = getValorNumerico(celulaValor,localizacaoValor);
					}
					catch(err){
						return;
					}

					linhaAtual+=1;

					data += this.gerarArquivoDeConfiguracaoParaUnidade(config);
				}while(true);
				linhaAtual+=1;
				localizacaoBloco = "A" + linhaAtual;
				celulaBloco = sheet[localizacaoBloco]; 
			}

			var blob = new Blob([data], {type: "text/plain;charset=us-ascii"});
			saveAs(blob, "gosoft.txt");
		},	

		gerarArquivoDeConfiguracaoParaUnidade : function(config){
			var data = "";
			var padding = 0;
			function makePadding(padding,padChar){
				if(padding < 0){
					throw "Erro Interno: Padding não pode ser menor que zero";
				}
				else{
					var data = "";
					var i;
					for(i=0;i<padding;i++){
						data += padChar;
					}
					return data;
				}
			}

			function virgulaDecimal(str,maxInteiro,maxDecimal){
				var number = str.split(".");
				var data = "";
				if(number.length > 2 || number.length < 1){
					throw "Erro Interno: Mais de um ponto contido no numero";
				}
				else if(number.length == 1){
					number[1] = "";
				}
				else if(number.length == 2 && number[1].length>maxDecimal){
					number[1] = number[1].substring(0,maxDecimal-1);
				}
				else if(number.length == 2 && number[0].length>maxInteiro){
					number[0] = number[0].substr(number[0].length-1-maxInteiro,number[0].length-1)
				}

				var parteInteira = makePadding(maxInteiro-number[0].length,"0") + number[0];
				var parteDecimal = number[1] + makePadding(maxDecimal-number[1].length,"0");

				return parteInteira + parteDecimal;
			}

			//TIPO
			padding = (10 - config.tipo.length);
			console.log(padding);
			data += config.tipo +makePadding(padding," ");
			//VERSAO
			padding = (2 - config.versao.length);
			data += makePadding(padding,"0") + config.versao;
			//CODIGO DO CONDOMINIO
			padding = (4 - config.codigoCondominio.length);
			data += makePadding(padding,"0") + config.codigoCondominio;
			//BLOCO
			padding = (4 - config.bloco.length);
			data += makePadding(padding," ") + config.bloco;
			//UNIDADE
			padding = (6 - config.unidade.length);
			data += makePadding(padding," ") + config.unidade; 
			//DATA LEITURA
			padding = (10 - config.dataLeitura.length);
			data += config.dataLeitura + makePadding(padding," ");
			//MES
			padding = (2 - config.mes.length);
			data += makePadding(padding,"0") + config.mes;
			//ANO
			padding = (4 - config.ano.length);
			data += makePadding(padding,"0") + config.ano;
			//LEITURA ANTERIOR
			data += virgulaDecimal(config.leituraAnterior,10,4);
			//LEITURA ATUAL
			data += virgulaDecimal(config.leituraAtual,10,4);
			//CONSUMO
			data += virgulaDecimal(config.consumo,10,4);
			//VALOR
			data += virgulaDecimal(config.valor,12,2);
			//NEWLINE
			data += '\n';
			return data;
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


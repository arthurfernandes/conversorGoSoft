/*
* @requires XLSX
* @requires jQuery as $
* @requires alertify
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
	//CACHE DOM
	var $tipo = $("#tipo"); 
	var $versao = $("#versao"); 
	var $codigoCondominio = $("#codigo-condominio");
	var $dataLeitura = $("#data-leitura");
	var $mes = $("#mes");
	var $ano = $("#ano");

	var $dropPlanilha = $("#drop-planilha");
	
	var workbook = undefined;
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

	return {
		esconderMensagemErro : function(){
			// self.$mensagemErro.hide();
		},

	 	mostrarMensagemErro : function(mensagem){
			alertify.alert(mensagem);
		},

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

			console.log(contemErros)

			return contemErros;
		},

		gerar : function(){
			//Build Config
			try{
				self.config = this.buildConfig();
			}
			catch(err){
				return this.mostrarMensagemErro(err);
			}
			//Get Workbook
			if(workbook == undefined){
				return this.mostrarMensagemErro("É necessário fazer upload de um arquivo .xlsx.");
			}

			if(workbook.SheetNames.length < 1){
				return this.mostrarMensagemErro("O arquivo não possui planilhas criadas.");
			}
			
			sheet = workbook.Sheets[workbook.SheetNames[0]]
			//Erro Interno da Biblioteca
			if(sheet == undefined){
				return this.mostrarMensagemErro("Um erro ocorreu ao processar o arquivo.")
			}	
		}	
	}
}());


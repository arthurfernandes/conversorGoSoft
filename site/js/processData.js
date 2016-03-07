/*
* @requires XLSX
*/

function get_radio_value( radioName ) {
	var radios = document.getElementsByName( radioName );
	for( var i = 0; i < radios.length; i++ ) {
		if( radios[i].checked ) {
			return radios[i].value;
		}
	}
}

function to_json(workbook) {
	var result = {};
	workbook.SheetNames.forEach(function(sheetName) {
		var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		if(roa.length > 0){
			result[sheetName] = roa;
		}
	});
	global workbook = workbook
	return result;
}

function to_csv(workbook) {
	var result = [];
	workbook.SheetNames.forEach(function(sheetName) {
		var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
		if(csv.length > 0){
			result.push("SHEET: " + sheetName);
			result.push("");
			result.push(csv);
		}
	});
	return result.join("\n");
}

function to_formulae(workbook) {
	var result = [];
	workbook.SheetNames.forEach(function(sheetName) {
		var formulae = XLSX.utils.get_formulae(workbook.Sheets[sheetName]);
		if(formulae.length > 0){
			result.push("SHEET: " + sheetName);
			result.push("");
			result.push(formulae.join("\n"));
		}
	});
	return result.join("\n");
}

var tarea = document.getElementById('b64data');
function b64it() {
	var wb = XLSX.read(tarea.value, {type: 'base64'});
	process_wb(wb);
}

function customValidateSheets(resultObj){
    // validate Client Information
	var output = "";
	$(resultObj.ClientDetails).each(function(index, element){
		if (element.Client_Name === undefined){
		   output = { "message" : "Client Name missing in data", "messageCode" : "10001", "messageExceptions" : "", "messageParams": ""};
		   alert("Client Name Missing");
		   return output;
		}
		if (element.Client_GUID === undefined){
		   output = { "message" : "Client GUID missing in data", "messageCode" : "10001", "messageExceptions" : "", "messageParams": ""};
		   alert("Client GUID Missing");
		   return output;
		}
		if (element.Client_URL === undefined){
		   output = { "message" : "Client URL missing in data", "messageCode" : "10001", "messageExceptions" : "", "messageParams": ""};
		   alert("Client URL Missing");
		   return output;
		}
	});
	// validate if resource have missing identifiers
	$(resultObj.Prices).each(function(index, element){ 
		if(element.Identifier === undefined 
		&& element.Price_per_Enrolment != undefined ){ 
		   output = { "message" : "Resources with missing Identifiers exist", "messageCode" : "20001", "messageExceptions" : "", "messageParams": element};
		   alert("Resources with Missing Identifiers exist");
		   return output;
		}
	});
	// validate if resource types missing identifiers
	$(resultObj.ResourceTypes).each(function(index, element){ 
		if(element.RESOURCE_TYPE === undefined 
		&& element.Price != undefined ){ 
		   output = { "message" : "Resources Types with missing Identifiers exist", "messageCode" : "20001", "messageExceptions" : "", "messageParams": element};
		   alert("Resource Types with Missing Identifiers exist");
		   return output;
		}
	});
	return output;
}

function process_wb(wb) {
	var output = "";
	var resultObj = "";
	switch(get_radio_value("format")) {
		case "json":
			resultObj = to_json(wb);
			var errorMessages = customValidateSheets(resultObj);
			// output = JSON.stringify(resultObj, 2, 2);
			break;
		case "form":
			output = to_formulae(wb);
			break; 
		default:
		output = to_csv(wb);
	}
	var clientDetails = JSON.stringify(resultObj.ClientDetails,2,2);
	// assume we need Price changed resources only 
	var resourcePrices = $.map(resultObj.Prices, 
				           function(obj) { if(obj.Price_Change !== undefined) return obj; }
		                 );
	resourcePrices = JSON.stringify(resourcePrices,2,2);
	// assume we need price changed resource types only
	var resourceTypePrices = $.map(resultObj.ResourceTypes, 
				              function(obj) {	if(obj.Change_To !== undefined) return obj; }
		                     );
	resourceTypePrices = JSON.stringify(resourceTypePrices,2,2);
	if (errorMessages !== undefined && errorMessages !== ""){ 
	   out.innerText = JSON.stringify(errorMessages,2,2); 
	} else {
		out.innerText = clientDetails + resourcePrices + resourceTypePrices;
	}
	// if(out.innerText === undefined) out.textContent = output; else out.innerText = customResult; 
}

var drop = document.getElementById('drop');
function handleDrop(e) {
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
			      // gives Type error has no method 'charCodeAt' needs investigation
			      //if (e.target.result.charCodeAt(0) == 0xd0) {
				  //  cfb = XLS.CFB.read(data, {type: 'binary'});
				  //	wb = XLS.parse_xlscfb(cfb);
				  //	process_wb(wb);
				  //}
			      //else {
				    //wb = XLSX.read(data, {type: 'binary'});
					//process_wb(wb, 'XLSX');
					arr = String.fromCharCode.apply(null, new Uint8Array(data));
					wb = XLSX.read(btoa(arr), {type: 'base64'});
					process_wb(wb);
				  //}
			   } catch(e){
			      console.log(e, e.stack);
				  // alertify.alert("We cannot process this file, contact your system Admin");
			   }
			   console.log("Stop....");
			}
			//if (data.length > 500000) alertify.confirm("This file is " + data.length + "bytes and may take few moments. Your browser may lock up during this process. Shall we proceed?",function(e){ if(e) doit(); else console.log("Stop ...");}); 
			//else { doit(); console.log("Stop....");}
			doit();
			//arr = String.fromCharCode.apply(null, new Uint8Array(data));
			//wb = XLSX.read(btoa(arr), {type: 'base64'});
			//process_wb(wb);
		};
		//reader.readAsBinaryString(f);
		reader.readAsArrayBuffer(f);
	}
}

function handleDragover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}

if(drop.addEventListener) {
	drop.addEventListener('dragenter', handleDragover, false);
	drop.addEventListener('dragover', handleDragover, false);
	drop.addEventListener('drop', handleDrop, false);
}



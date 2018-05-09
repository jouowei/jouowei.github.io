var dataParsed = new Array();
$(function(){
	$('#submit-parse').click(function(){
		stepped = 0;
		chunks = 0;
		rows = 0;
		errorCount = 0;
		var files = $('#files')[0].files;
		var config = buildConfig();

		if (files.length > 0){
			for (var i = 0; i < files.length; i++){
				if (files[i].size > 1024 * 1024 * 10){
					alert("A file you've selected is larger than 10 MB; please choose to stream or chunk the input to prevent the browser from crashing.");
					return;				
				}
			}
            start = performance.now();
			$('#files').parse({
				config: config,
				before: function(file, inputElem){
					console.log("Parsing file:", file);
				},
				error: function(err, file)
				{
					console.log("ERROR:", err, file);
					firstError = firstError || err;
					errorCount++;
				},
				complete: function(){                    
                    alert("Done with all files.");
				}
			});
		}
		else{
			start = performance.now();
			var results = Papa.parse(txt, config);
			console.log("Synchronous parse results:", results);
        }
	});
});

function buildConfig(){
	return {
		delimiter: ",",
        newline: getLineEnding(),
        dynamicTyping: true,
		header: false,
        encoding: "Big5",
		worker: "",
		complete: completeFn,
		error: errorFn,
		download: "",
		fastMode: "",
		skipEmptyLines: true,
    };
    
    function getLineEnding(){
		if ($('#newline-n').is(':checked'))
			return "\n";
		else if ($('#newline-r').is(':checked'))
			return "\r";
		else if ($('#newline-rn').is(':checked'))
			return "\r\n";
		else
			return "";
	}
}

function errorFn(error, file){
	console.log("ERROR:", error, file);
}

function completeFn(){
    var rawArr = new Array();
    end = performance.now();
	if (arguments[0] && arguments[0].data){
        rows = arguments[0].data.length;
        columns = arguments[0].data[2].length;
        for(i=3; i < rows; i++){
            var nullValue = false;
            var raw = new Object();
            rawArr["id"] = i-2;
            for(j=0; j < columns; j++){
                header = arguments[0].data[2][j];
                raw[header] = arguments[0].data[i][j];
                if(header === "null" || header === null || typeof header === "undefined"){
                    continue;
                }
                if (raw[header] === "null" || raw[header] === null || typeof raw[header] === "undefined") {
                    nullValue = true;
                }
            }
            if(!nullValue)
            rawArr.push(raw);
        }
    }
    dataParsed.push(rawArr);
    console.log("Finished input (async). Time:", end-start, rawArr);
}
function configBuilder(){
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
            for(j=0; j < columns; j++){
                header = arguments[0].data[2][j];
                raw[header] = arguments[0].data[i][j];
                if(header === "null" || header === null || typeof header === "undefined"){
                    continue;
                }
                if (raw[header] === "null" || raw[header] === null || typeof raw[header] === "undefined") {
                    continue;
				}
				if(keyParsed.indexOf(header) == -1){
					keyParsed.push(header);
				}
			}
			dataParsed.push(raw);
        }
    }
}

//Excel資料處理
function orderBuilder(){
    var lianhua_orders = new Array();
    var dirtys = new Array();
	dataParsed.forEach(data => {
        var dirtydata = new lianhua();
        var isEmpty = false;
        
        //排掉原檔因排版而出現的空行，以及行數不存在的錯誤
        for (var i = 0; i < key.length; i++){
            if (data[key[i]] === "null" || data[key[i]] === null || typeof data[key[i]] === "undefined") {
                isEmpty = true;
            }
        }
        
        //存成lianhua格式
        if(!isEmpty){  
            dirtydata.ship_ID.push(data["單據類型"].toString()+"#"+data["單據號碼"].toString());         
            dirtydata.pickupdate = moment(data["預計揀貨日"]).format('YYYY-MM-DD');
            dirtydata.shipdate = moment(data["承諾交貨日"]).format('YYYY-MM-DD');
            dirtydata.clientname = data["送貨地址"].toString();
            dirtydata.order_ID = moment(data["承諾交貨日"]).format('YYYYMMDD') +"_"+ data["車次"].toString();                
            dirtydata.contact_info = data["說明"].toString();
            dirtydata.ship_area = data["縣市"].toString();                        
            dirtydata.ship_district = data["鄉鎮市區"].toString();
            dirtydata.good_size = data["出貨材積(立方米)"].toString();
            dirtys.push(dirtydata);	
        }
    });
    //把多筆整合成一筆
    var cleans = new Array();
    var arrOrder = []; //儲存OrderID
    var singleOrder = 0;

    dirtys.forEach(function(dirtydata){
        var single_order = new lianhua();
        var cleandata = new lianhua();
        var order_CBM = 0;
        
        //如果ship_ID還沒處理過，檢查order
        if (!arrOrder.filter(function(e) {return e.ship_ID === dirtydata.ship_ID[0];}).length > 0) {
            //如果order_ID還沒處理過，開始計算運費
            if (!arrOrder.filter(function(e) {return e.order_ID === dirtydata.order_ID;}).length > 0) {
                // 把整筆訂單拉出來
                single_order = dirtys.filter(
                    function(x){
                        return x.order_ID === dirtydata.order_ID; 
                    }
                );
                //計算材積
                single_order.forEach(ship =>{
                    order_CBM += parseFloat(ship.good_size);
                });
                cleandata = single_order[0];
                cleandata.good_size = order_CBM;
                //找出送貨點類型 (倉庫，工廠或其他)
                for(i = 0; i < lianhua_clienttype.length; i++ ){
                    if(dirtydata.clientname.includes(lianhua_clienttype[i]["keyword"]).toString()){
                        cleandata.client_type = lianhua_clienttype[i]["type"];
                        break;
                    }
                    else{
                        cleandata.client_type = "other";
                    }
                }
                //計算運費
                cleandata.delivery_fee = calTotalPrice(cleandata.good_size,cleandata.client_type,cleandata.ship_area);
                cleans.push(cleandata);
            }else{
                for(i = 0; i< cleans.length; i++){
                    if(cleans[i].order_ID === dirtydata.order_ID){
                        cleans[i].ship_ID.push(dirtydata.ship_ID[0]);
                        break;
                    }
                }
            }
            arrOrder.push({order_ID:dirtydata.order_ID,ship_ID:dirtydata.ship_ID[0]});
        }
    });
    return cleans;
	// return JSON.parse(JSON.stringify(cleans));
}

function getValueByKey(key,data){
    for(i=0;i<data.length;i++){
        if(data[i] && data[i].hasOwnProperty(key)) {
            return data[i][key];
        }
    }
    return -1;
}

///聯華運費計算公式： CBM 數量 => 判斷是指定倉庫，工廠或是其他地方 => 地區(台南/高屏) => 計算出對應的價格
function calTotalPrice(unit, type, area){
    if(area.includes("屏東") || area.includes("高雄") ){
        area = "高雄市";
    }
    var arrX = lianhua_shipfee.filter(function(e) {return(e.shipto === area && e.type === type);})
    for(i = 0; i < arrX.length; i++){
        if(arrX[i].maxCBM > unit){
            return Math.round(arrX[i].unitprice*unit);
        }
    }
}
//讀取csv的欄位名稱
var key = ["預計揀貨日","承諾交貨日","送貨地址","車次","單據類型","單據號碼","說明","縣市","鄉鎮市區","出貨材積(立方米)"];

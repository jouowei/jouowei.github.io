//聯華單據格式
var lianhua = function(){       
    this.order_ID = "";             //需求單編號 (日期8碼+"_"+車次)
    this.ship_ID = [];              //單據號碼 (單據類型+"#"+單據)
    this.pickupdate = "";           //到客戶端取貨日
    this.shipdate = "";             //送貨日
    this.clientname = "";           //目的地 (終端客戶的聯華ID)
    this.client_type = "";          //客戶類型 (計算運費用)
    this.delivery_fee = "";         //運費
    this.contact_info = "";         //送貨地址或公司名稱
    this.ship_area = "";            //縣市
    this.ship_district = "";        //區域
    this.driver = "";               //駕駛
    this.good_size = 0;			    //材積 (CBM)
    this.comment = "";              //備註
};

//出貨單schema
var order = {
    business_type:'聯華',       //出貨單類型
    delivery_date:'',           //揀貨日期 (上游取貨)
    client_name:'',             //客戶名稱
    order_ID:'',                //出貨單號
    ships:'',                   //送貨單 (見下方ships)
    delivery_fee:'',            //運費
    good_size:'',               //材積 (CBM) (新增)
    comment:''                  //出貨單備註
};
//送貨單schema
var ship = {
ship_ID:'',         //送貨單號
ship_driver:'',     //司機姓名
ship_deleted:'',    //此單狀態 (''=正常,'1'=刪除)
ship_datetime:'',   //出貨日期 (送到客戶端)
contact_info:'',    //客戶連絡電話 or 地址
ship_area:'',       //縣市
ship_district:'',   //區域
};
 
//聯華用(客戶類型)
var lianhua_clienttype = [
    { id:1, keyword: "全台物流",type: "warehouse" },
    { id:2, keyword: "捷盟行銷",type: "warehouse" },
    { id:3, keyword: "萊爾富國際",type: "warehouse" },
    { id:4, keyword: "百及物流",type: "warehouse" },
    { id:5, keyword: "弘達流通",type: "warehouse" },
    { id:6, keyword: "家樂福",type: "warehouse" },
    { id:7, keyword: "統一超食代",type: "factory" },
    { id:8, keyword: "育勇高雄",type: "warehouse" }
    ];

//聯華用(運費表)
var lianhua_shipfee = [
    { shipto: "台南市", type: "warehouse", maxCBM: 1, unitprice: 744.76}, 
    { shipto: "台南市", type: "factory", maxCBM: 1, unitprice: 744.76},
    { shipto: "台南市", type: "other", maxCBM: 1, unitprice: 763.81},
    { shipto: "台南市", type: "warehouse", maxCBM: 3, unitprice: 711.43}, 
    { shipto: "台南市", type: "factory", maxCBM: 3, unitprice: 711.43},
    { shipto: "台南市", type: "other", maxCBM: 3, unitprice: 730.48},
    { shipto: "台南市", type: "warehouse", maxCBM: 6, unitprice: 530.48}, 
    { shipto: "台南市", type: "factory", maxCBM: 6, unitprice: 530.48},
    { shipto: "台南市", type: "other", maxCBM: 6, unitprice: 549.52},
    { shipto: "台南市", type: "warehouse", maxCBM: 16, unitprice: 366.67}, 
    { shipto: "台南市", type: "factory", maxCBM: 16, unitprice: 366.67},
    { shipto: "台南市", type: "other", maxCBM: 16, unitprice: 390.48},
    { shipto: "台南市", type: "warehouse", maxCBM: 24, unitprice: 366.67}, 
    { shipto: "台南市", type: "factory", maxCBM: 24, unitprice: 366.67},
    { shipto: "台南市", type: "other", maxCBM: 24, unitprice: 390.48},
    { shipto: "台南市", type: "warehouse", maxCBM: 32, unitprice: 366.67}, 
    { shipto: "台南市", type: "factory", maxCBM: 32, unitprice: 366.67},
    { shipto: "台南市", type: "other", maxCBM: 32, unitprice: 390.48},
    { shipto: "台南市", type: "warehouse", maxCBM: 48, unitprice: 366.67}, 
    { shipto: "台南市", type: "factory", maxCBM: 48, unitprice: 366.67},
    { shipto: "台南市", type: "other", maxCBM: 48, unitprice: 390.48},
    { shipto: "台南市", type: "warehouse", maxCBM: 64, unitprice: 346.67}, 
    { shipto: "台南市", type: "factory", maxCBM: 64, unitprice: 346.67},
    { shipto: "台南市", type: "other", maxCBM: 64, unitprice: 373.33},
    { shipto: "台南市", type: "warehouse", maxCBM: 80, unitprice: 325.71}, 
    { shipto: "台南市", type: "factory", maxCBM: 80, unitprice: 325.71},
    { shipto: "台南市", type: "other", maxCBM: 80, unitprice: 352.38},
    { shipto: "高雄市", type: "warehouse", maxCBM: 1, unitprice: 761.9}, 
    { shipto: "高雄市", type: "factory", maxCBM: 1, unitprice: 761.9},
    { shipto: "高雄市", type: "other", maxCBM: 1, unitprice: 780.95},
    { shipto: "高雄市", type: "warehouse", maxCBM: 3, unitprice: 728.57}, 
    { shipto: "高雄市", type: "factory", maxCBM: 3, unitprice: 728.57},
    { shipto: "高雄市", type: "other", maxCBM: 3, unitprice: 747.62},
    { shipto: "高雄市", type: "warehouse", maxCBM: 6, unitprice: 547.62}, 
    { shipto: "高雄市", type: "factory", maxCBM: 6, unitprice: 547.62},
    { shipto: "高雄市", type: "other", maxCBM: 6, unitprice: 566.67},
    { shipto: "高雄市", type: "warehouse", maxCBM: 16, unitprice: 376.19}, 
    { shipto: "高雄市", type: "factory", maxCBM: 16, unitprice: 376.19},
    { shipto: "高雄市", type: "other", maxCBM: 16, unitprice: 400},
    { shipto: "高雄市", type: "warehouse", maxCBM: 24, unitprice: 376.19}, 
    { shipto: "高雄市", type: "factory", maxCBM: 24, unitprice: 376.19},
    { shipto: "高雄市", type: "other", maxCBM: 24, unitprice: 400},
    { shipto: "高雄市", type: "warehouse", maxCBM: 32, unitprice: 376.19}, 
    { shipto: "高雄市", type: "factory", maxCBM: 32, unitprice: 376.19},
    { shipto: "高雄市", type: "other", maxCBM: 32, unitprice: 400},
    { shipto: "高雄市", type: "warehouse", maxCBM: 48, unitprice: 376.19}, 
    { shipto: "高雄市", type: "factory", maxCBM: 48, unitprice: 376.19},
    { shipto: "高雄市", type: "other", maxCBM: 48, unitprice: 400},
    { shipto: "高雄市", type: "warehouse", maxCBM: 64, unitprice: 357.14}, 
    { shipto: "高雄市", type: "factory", maxCBM: 64, unitprice: 357.14},
    { shipto: "高雄市", type: "other", maxCBM: 64, unitprice: 383.81},
    { shipto: "高雄市", type: "warehouse", maxCBM: 80, unitprice: 336.19}, 
    { shipto: "高雄市", type: "factory", maxCBM: 80, unitprice: 336.19},
    { shipto: "高雄市", type: "other", maxCBM: 80, unitprice: 362.86}
    ];
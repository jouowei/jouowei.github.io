var myApp = angular.module('lianhua_form',[]);

//MVC的M
myApp.service('myService', function() {
    this.cleanData = function() {
		return orderBuilder();
	}
	this.buildConfig = function(){
		return configBuilder();
	}
});

//MVC的C
myApp.controller('formCtrl', function($scope,$http,myService) {
	$scope.drivers = drivers;
	$scope.orders = [];
	$scope.parseFiles = function(){
		rows = 0;
		errorCount = 0;
		dataParsed = new Array();
		keyParsed = new Array();
		var files = $('#files')[0].files;
		var config = myService.buildConfig();

		if (files.length > 0){
			for (var i = 0; i < files.length; i++){
				if (files[i].size > 1024 * 1024 * 10){
					alert("資料量過大，請拆成幾個10MB以下的檔案");
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
					$scope.lianhuas = myService.cleanData();
					setTimeout(function(){
						$("#tblShipContent").focus();
						$("#tblShipContent").trigger("click");
					}, 2000);
					
				}
			});
		}
		else{
			start = performance.now();
			var results = Papa.parse(txt, config);
			console.log("Synchronous parse results:", results);
		}
	};

	//驗證與POST request
    $scope.validateNcal = function(rawdata,doSubmit){
		//驗證

		//資料整理
		var arrFinalData = [];
		rawdata.forEach(function(x,index){
			console.log("calcuating order #"+index+"...");
			var submitOrder = order;
			var submitShips = [];
			submitOrder.order_ID = x.order_ID;
			submitOrder.delivery_date = x.pickupdate;
			submitOrder.client_name = x.contact_info;
			submitOrder.good_size = x.good_size;
			submitOrder.delivery_fee = x.delivery_fee;
			submitOrder.comment = x.comment;
			x.driver.forEach(i =>{
				var submitShip = ship;
				submitShip.ship_driver = i;
				submitShip.ship_ID = x.ship_ID.toString();
				submitShip.ship_datetime = x.shipdate;
				submitShip.ship_area = x.ship_area;
				submitShip.ship_district = x.ship_district;
				submitShip.contact_info = x.clientname;
				submitShips.push(submitShip);
			});
			submitOrder.ships = submitShips;
			arrFinalData.push(submitOrder);
		});
		//POST request
		
        $("input[type=button]").attr("disabled", "disabled");
        $("input[type=text]").attr("disabled", "disabled");
        $("input[type=select]").attr("disabled", "disabled");
        
        /*
        var SUBMIT_ORDER_API = "https://ct-erp.appspot.com/order";
        var SUBMIT_ORDER_API = "https://jt-erp.appspot.com/order";
        */
        var SUBMIT_ORDER_API = "http://localhost/order";
        try{
            $http({
                url: SUBMIT_ORDER_API,                         
                method: "POST",
                data: arrFinalData,
                headers:{'Content-Type': 'application/json','Access-Control-Allow-Origin': '*' }
            })
            .then(function(response) {
                if (response.status === 200) {
                	alert(response.data);
                    if (response.data === "新增成功"){
                        setTimeout(function(){ location.reload(); }, 2000);
                    }
                } 
                else {
                    throw '系統出現問題，請通知工程師處理 "level:1" \n'+ response.data;
                }
            },
            function errorCallback(response) {
                return alert('系統出現問題，請通知工程師處理 \n'+response.data);
            });
        }
        catch(err){
            return alert(err);
        }
		
	};
});
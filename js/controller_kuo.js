var myApp = angular.module('deliveyform',[]);

//依照欄位key篩選data
myApp.filter('unique', function() {
    return function(input, key) {
        var unique = {};
        var uniqueList = [];
        for(var i = 0; i < input.length; i++){
            if(typeof unique[input[i][key]] == "undefined"){
                unique[input[i][key]] = "";
                uniqueList.push(input[i]);
            }
        }
        return uniqueList;
    };
});

//自動focus到最後一行
myApp.directive('customAutofocus', function() {
  return{
         restrict: 'A',

         link: function(scope, element, attrs){
           scope.$watch(function(){
             return scope.$eval(attrs.customAutofocus);
             },function (newValue){
               if (newValue == true){
                   element[0].focus();
               }
           });
         }
     };
});

//資料控制部分
myApp.controller('formCtrl', function($scope,$http) {
    $scope.order = order;
    $scope.order.ships = ships;
    $scope.order_store = order_store;
    $scope.drivers = drivers;
    $scope.rawdata = rawdata;
    $scope.arriveAfter = arriveAfter;
    $scope.arriveBefore = arriveBefore;

    
    $scope.setQuery = function(query) {
        $scope.query = query;
        $scope.focus = false;
    };
    //自動更新時間
    $scope.updateTime = function (ship) {
        if(ship.arriveAfter.length == 0 || ship.arriveBefore.length == 0){
            ship.ship_datetime = "";
        }
        else if(ship.arriveAfter=="不指定" && ship.arriveBefore == "不指定" ){
            ship.ship_datetime = "不指定";
        }
        else if(ship.arriveAfter=="不指定" && ship.arriveBefore.length > 0){
            ship.ship_datetime = ship.arriveBefore + "前";
        }
        else if(ship.arriveBefore =="不指定" && ship.arriveAfter.length > 0){
            ship.ship_datetime = ship.arriveAfter + "以後";
        }
        else{
            ship.ship_datetime = ship.arriveAfter+"~"+ship.arriveBefore;
        }
    };
    //根據縣市拉出對應的鄉鎮區域
    $scope.update = function (selectedValue) {
        var arrayDistrict=new Array();
        $scope.rawdata.forEach(function(x){
            if(x.city == selectedValue) {
                if(x.id %2 != 1){
                    arrayDistrict.push(x.district);
                }                
            }
        })
        /*
        $scope.order.ships.forEach(function(x){
            x.ship_area = selectedValue;
        })
        $scope.selCity = selectedValue;
        */
        $scope.level2 = arrayDistrict;
    };
    //刪除一筆送貨單
    $scope.deleteShip = function (ship) {
        ship.ship_deleted = "1";
    };
    //新增一筆送貨單
    $scope.addNewShip = function(){
        var ship = { 
            ship_ID:'',         //送貨單號
            ship_orderStore:'', //發單門市
            ship_driver:'',     //司機姓名
            ship_deleted: '',   //此單狀態 (''=正常,'1'=刪除)
            arriveAfter:'',
            arriveBefore:'',
            ship_datetime:'',   //送達時間
            contact_info:'',    //客戶連絡電話 or 地址
            ship_area:$scope.order.ships[0].ship_area,       //縣市
            ship_district:'',   //區域
            car_ID:'',          //車號
            is_elevator:'',     //是否有搭電梯 (+100)
            floors_byhand:'',   //手搬樓層數 (1樓+100)
            amount_collect:'',  //代收貨款
            comment:''          //備註
        };
        $scope.order.ships.push(ship);
        $scope.focusIndex = $scope.order.ships.length-1;
    };

    $scope.customFilter = function(obj){
        if(obj.ship_deleted.length == 0)
        {
            return obj;
        }
    };
    //驗證資料 & 計算價格
    $scope.validateNcal = function(order,doSubmit){
        var errormsg = "";
        var basic_fee = new Array();
        var floor =  0;
        var elevator = 0;
        var comment = $('#commentText').val();
        $('#commentText').val("");
        order.ships.forEach(function(x){
            if(x.ship_deleted == "1"){
                return;
            }
            else{
                x.comment="";
                if (x.ship_orderStore == null || x.ship_orderStore.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請確認發單門市';
                }                
                if (x.ship_ID == null || x.ship_ID.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請確認送貨單號';
                }
                if(x.ship_driver == null ||  x.ship_driver.length == 0) {
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += "請選擇司機姓名";
                }
                if(x.ship_district == null ||  x.ship_district.length == 0) {
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += "請選擇送貨區域";
                }
                if (x.ship_datetime == null || x.ship_datetime.length == 0){
                    x.ship_datetime = '不指定';
                }
                else if (x.ship_datetime !== "不指定"){ 
                    if(x.comment.length > 0){x.comment += '\n'}
                    x.comment += '客戶指定於'+ x.ship_datetime+'送達。';
                }
                if (x.contact_info == null || x.contact_info.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請確認聯絡資訊';
                }      
                if (x.is_elevator == null || x.is_elevator.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請選擇有無電梯';
                } 
                else if(x.is_elevator == "有"){ 
                    elevator = elevator + 1; 
                }
                if (x.floors_byhand == null || x.floors_byhand.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請確認手搬樓層數';
                } 
                else if(x.floors_byhand > 0){ 
                    floor = floor + parseInt(x.floors_byhand); 
                    if(x.comment.length > 0){x.comment += '\n'}
                    x.comment += '需手搬'+x.floors_byhand+'層樓。';
                }
                if (x.amount_collect == null || x.amount_collect.length == 0){
                    if(errormsg.length > 0){errormsg += "\n";}
                    errormsg += '請確認預收現金';
                }
                else if(x.amount_collect > 0){
                    if(x.comment.length > 0){x.comment += '\n'}
                    x.comment += '有預收款'+x.amount_collect+'元。';
                }
                $scope.rawdata.forEach(function(y){
                    if(y.district == x.ship_district && y.car_type == $scope.order.car_type) {
                        basic_fee.push(parseInt(y.fare));
                    }
                })
           }
        })
        if(errormsg.length == 0 ){
        //計價公式
            order.delivery_fee = Math.max.apply(null, basic_fee) + 100 * (basic_fee.length - 1 + floor + elevator)
            $('#fee_result').val(order.delivery_fee);
            $('#commentText').val(comment);
            return true;
        }
        else{
            $('#fee_result').val("請重新檢查表格");
            $('#commentText').val(comment);
            return false;
        }
    };
    //送出資料
    $scope.submitForm = function() {
        $("input[type=button]").attr("disabled", "disabled");
        $("input[type=text]").attr("disabled", "disabled");
        $("input[type=select]").attr("disabled", "disabled");
        
        var business_type = "郭元益";
        var delivery_date =  $('#datepicker').val();
        var order_ID = $scope.order.order_ID;
        var car_type = $scope.order.car_type;
        var delivery_fee = $scope.order.delivery_fee;
        var comment = $('#commentText').val();
        $scope.order.ships.forEach(function(x){
            if(x.ship_deleted == "1" ){
                return;
            }
            if(comment.length > 0){
                if(x.comment.length > 0 && x.comment !== null){
                    x.comment += "\n註:"+comment;
                }
                else if(x.comment.length == 0){
                    x.comment ="註:"+comment;
                }
            }
            var shipdata = {
                business_type: business_type,
                delivery_date: delivery_date,
                driver_name: x.ship_driver,
                car_type: car_type,
                order_ID: order_ID,
                delivery_fee: delivery_fee,                    
                order_comment: comment,
                ship_ID: x.ship_ID,
                ship_orderstore: x.ship_orderStore, //發單門市
                ship_area: x.ship_area,
                ship_district: x.ship_district,
                ship_datetime: x.ship_datetime,                    
                contact_info: x.contact_info,
                is_elevator: x.is_elevator,
                floors_byhand: x.floors_byhand,
                amount_collect: x.amount_collect,
                ship_comment: x.comment 
            }
            try{
                var TYPE1_SUBMIT_FORM_API = "https://script.google.com/macros/s/AKfycbzomZj2EcfrQPU1bZsGLjlwINtcPSJ9fxk4ZA2NYy8mb1rH3iw/exec";
                $http({
                    url:TYPE1_SUBMIT_FORM_API,                         
                    method: 'POST',
                    transformRequest: function(obj) {
                        var str = [];
                        for(var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        return str.join("&");
                    },
                    data: shipdata,
                    headers:{'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
                })
                .then(function(response) {
                    if (response.status === 200) {
                        return;
                    } 
                    else {
                        return alert('網路連線問題，請再試一次 \n'+ response.data);
                    }
                });
            }
            catch(err){
                return alert('系統出現問題，請重新整理網頁後再試一次 \n'+err);
            }
    
        });    
        alert('新增成功');   
        setTimeout(function(){ location.reload(); }, 2000);
    };
});

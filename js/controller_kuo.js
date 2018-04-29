var myApp = angular.module('deliveyform',[]);

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

myApp.controller('formCtrl', function($scope,$http) {
    //運費lookup table
    $scope.rawdata = [
        {id: 1, city: '高雄市', district: '前金區', car_type: '3.5t', fare: '480'},
        {id: 2, city: '高雄市', district: '前金區', car_type: '6.8t', fare: '900'},
        {id: 3, city: '高雄市', district: '前鎮區', car_type: '3.5t', fare: '500'},
        {id: 4, city: '高雄市', district: '前鎮區', car_type: '6.8t', fare: '1050'},
        {id: 5, city: '高雄市', district: '新興區', car_type: '3.5t', fare: '480'},
        {id: 6, city: '高雄市', district: '新興區', car_type: '6.8t', fare: '900'},
        {id: 7, city: '高雄市', district: '苓雅區', car_type: '3.5t', fare: '480'},
        {id: 8, city: '高雄市', district: '苓雅區', car_type: '6.8t', fare: '900'},
        {id: 9, city: '高雄市', district: '鹽埕區', car_type: '3.5t', fare: '480'},
        {id: 10, city: '高雄市', district: '鹽埕區', car_type: '6.8t', fare: '900'},
        {id: 11, city: '高雄市', district: '三民區', car_type: '3.5t', fare: '600'},
        {id: 12, city: '高雄市', district: '三民區', car_type: '6.8t', fare: '1050'},
        {id: 13, city: '高雄市', district: '鼓山區', car_type: '3.5t', fare: '600'},
        {id: 14, city: '高雄市', district: '鼓山區', car_type: '6.8t', fare: '1050'},
        {id: 15, city: '高雄市', district: '旗津區', car_type: '3.5t', fare: '900'},
        {id: 16, city: '高雄市', district: '旗津區', car_type: '6.8t', fare: '1350'},
        {id: 17, city: '高雄市', district: '小港區', car_type: '3.5t', fare: '700'},
        {id: 18, city: '高雄市', district: '小港區', car_type: '6.8t', fare: '1200'},
        {id: 19, city: '高雄市', district: '左營區', car_type: '3.5t', fare: '600'},
        {id: 20, city: '高雄市', district: '左營區', car_type: '6.8t', fare: '1050'},
        {id: 21, city: '高雄市', district: '楠梓區', car_type: '3.5t', fare: '700'},
        {id: 22, city: '高雄市', district: '楠梓區', car_type: '6.8t', fare: '1200'},
        {id: 23, city: '高雄市', district: '仁武區', car_type: '3.5t', fare: '750'},
        {id: 24, city: '高雄市', district: '仁武區', car_type: '6.8t', fare: '1250'},
        {id: 25, city: '高雄市', district: '鳥松區', car_type: '3.5t', fare: '700'},
        {id: 26, city: '高雄市', district: '鳥松區', car_type: '6.8t', fare: '1200'},
        {id: 27, city: '高雄市', district: '大樹區', car_type: '3.5t', fare: '900'},
        {id: 28, city: '高雄市', district: '大樹區', car_type: '6.8t', fare: '1350'},
        {id: 29, city: '高雄市', district: '大寮區', car_type: '3.5t', fare: '800'},
        {id: 30, city: '高雄市', district: '大寮區', car_type: '6.8t', fare: '1350'},
        {id: 31, city: '高雄市', district: '林園區', car_type: '3.5t', fare: '900'},
        {id: 32, city: '高雄市', district: '林園區', car_type: '6.8t', fare: '1500'},
        {id: 33, city: '高雄市', district: '橋頭區', car_type: '3.5t', fare: '900'},
        {id: 34, city: '高雄市', district: '橋頭區', car_type: '6.8t', fare: '1500'},
        {id: 35, city: '高雄市', district: '梓官區', car_type: '3.5t', fare: '900'},
        {id: 36, city: '高雄市', district: '梓官區', car_type: '6.8t', fare: '1500'},
        {id: 37, city: '高雄市', district: '彌陀區', car_type: '3.5t', fare: '900'},
        {id: 38, city: '高雄市', district: '彌陀區', car_type: '6.8t', fare: '1500'},
        {id: 41, city: '高雄市', district: '永安區', car_type: '3.5t', fare: '1100'},
        {id: 42, city: '高雄市', district: '永安區', car_type: '6.8t', fare: '1700'},
        {id: 43, city: '高雄市', district: '大社區', car_type: '3.5t', fare: '900'},
        {id: 44, city: '高雄市', district: '大社區', car_type: '6.8t', fare: '1500'},
        {id: 45, city: '高雄市', district: '鳳山區', car_type: '3.5t', fare: '600'},
        {id: 46, city: '高雄市', district: '鳳山區', car_type: '6.8t', fare: '1050'},
        {id: 47, city: '高雄市', district: '岡山區', car_type: '3.5t', fare: '900'},
        {id: 48, city: '高雄市', district: '岡山區', car_type: '6.8t', fare: '1500'},
        {id: 49, city: '高雄市', district: '燕巢區', car_type: '3.5t', fare: '900'},
        {id: 50, city: '高雄市', district: '燕巢區', car_type: '6.8t', fare: '1500'},
        {id: 51, city: '高雄市', district: '旗山區', car_type: '3.5t', fare: '1300'},
        {id: 52, city: '高雄市', district: '旗山區', car_type: '6.8t', fare: '1800'},
        {id: 53, city: '高雄市', district: '美濃區', car_type: '3.5t', fare: '1400'},
        {id: 54, city: '高雄市', district: '美濃區', car_type: '6.8t', fare: '2100'},
        {id: 55, city: '高雄市', district: '甲仙區', car_type: '3.5t', fare: '2300'},
        {id: 56, city: '高雄市', district: '甲仙區', car_type: '6.8t', fare: '3450'},
        {id: 57, city: '高雄市', district: '杉林區', car_type: '3.5t', fare: '1800'},
        {id: 58, city: '高雄市', district: '杉林區', car_type: '6.8t', fare: '2700'},
        {id: 59, city: '高雄市', district: '那瑪夏區', car_type: '3.5t', fare: '3000'},
        {id: 60, city: '高雄市', district: '那瑪夏區', car_type: '6.8t', fare: '4500'},
        {id: 61, city: '高雄市', district: '茂林區', car_type: '3.5t', fare: '3000'},
        {id: 62, city: '高雄市', district: '茂林區', car_type: '6.8t', fare: '4500'},
        {id: 63, city: '高雄市', district: '六龜區', car_type: '3.5t', fare: '2000'},
        {id: 64, city: '高雄市', district: '六龜區', car_type: '6.8t', fare: '3000'},
        {id: 65, city: '高雄市', district: '桃源區', car_type: '3.5t', fare: '3000'},
        {id: 66, city: '高雄市', district: '桃源區', car_type: '6.8t', fare: '4500'},
        {id: 67, city: '高雄市', district: '內門區', car_type: '3.5t', fare: '1600'},
        {id: 68, city: '高雄市', district: '內門區', car_type: '6.8t', fare: '2400'},
        {id: 69, city: '屏東縣市', district: '屏東市', car_type: '3.5t', fare: '1100'},
        {id: 70, city: '屏東縣市', district: '屏東市', car_type: '6.8t', fare: '1650'},
        {id: 71, city: '屏東縣市', district: '九如鄉', car_type: '3.5t', fare: '1300'},
        {id: 72, city: '屏東縣市', district: '九如鄉', car_type: '6.8t', fare: '2400'},
        {id: 73, city: '屏東縣市', district: '長治鄉', car_type: '3.5t', fare: '1600'},
        {id: 74, city: '屏東縣市', district: '長治鄉', car_type: '6.8t', fare: '2400'},
        {id: 75, city: '屏東縣市', district: '麟洛鄉', car_type: '3.5t', fare: '1300'},
        {id: 76, city: '屏東縣市', district: '麟洛鄉', car_type: '6.8t', fare: '1800'},
        {id: 77, city: '屏東縣市', district: '萬丹鄉', car_type: '3.5t', fare: '1400'},
        {id: 78, city: '屏東縣市', district: '萬丹鄉', car_type: '6.8t', fare: '1950'},
        {id: 79, city: '屏東縣市', district: '竹田鄉', car_type: '3.5t', fare: '1500'},
        {id: 80, city: '屏東縣市', district: '竹田鄉', car_type: '6.8t', fare: '2100'},
        {id: 81, city: '屏東縣市', district: '內埔鄉', car_type: '3.5t', fare: '1600'},
        {id: 82, city: '屏東縣市', district: '內埔鄉', car_type: '6.8t', fare: '2200'},
        {id: 83, city: '屏東縣市', district: '鹽埔鄉', car_type: '3.5t', fare: '1600'},
        {id: 84, city: '屏東縣市', district: '鹽埔鄉', car_type: '6.8t', fare: '2200'},
        {id: 85, city: '屏東縣市', district: '里港鄉', car_type: '3.5t', fare: '1700'},
        {id: 86, city: '屏東縣市', district: '里港鄉', car_type: '6.8t', fare: '2350'},
        {id: 87, city: '屏東縣市', district: '高樹鄉', car_type: '3.5t', fare: '1900'},
        {id: 88, city: '屏東縣市', district: '高樹鄉', car_type: '6.8t', fare: '2650'},
        {id: 89, city: '屏東縣市', district: '三地門鄉', car_type: '3.5t', fare: '2100'},
        {id: 90, city: '屏東縣市', district: '三地門鄉', car_type: '6.8t', fare: '2900'},
        {id: 91, city: '屏東縣市', district: '霧台鄉', car_type: '3.5t', fare: '2600'},
        {id: 92, city: '屏東縣市', district: '霧台鄉', car_type: '6.8t', fare: '3600'},
        {id: 93, city: '屏東縣市', district: '瑪家鄉', car_type: '3.5t', fare: '2500'},
        {id: 94, city: '屏東縣市', district: '瑪家鄉', car_type: '6.8t', fare: '3500'},
        {id: 95, city: '屏東縣市', district: '泰武鄉', car_type: '3.5t', fare: '2600'},
        {id: 96, city: '屏東縣市', district: '泰武鄉', car_type: '6.8t', fare: '3600'},
        {id: 97, city: '屏東縣市', district: '來義鄉', car_type: '3.5t', fare: '2600'},
        {id: 98, city: '屏東縣市', district: '來義鄉', car_type: '6.8t', fare: '3600'},
        {id: 99, city: '屏東縣市', district: '萬巒鄉', car_type: '3.5t', fare: '1700'},
        {id: 100, city: '屏東縣市', district: '萬巒鄉', car_type: '6.8t', fare: '2400'},
        {id: 101, city: '屏東縣市', district: '潮州鎮', car_type: '3.5t', fare: '1700'},
        {id: 102, city: '屏東縣市', district: '潮州鎮', car_type: '6.8t', fare: '2400'},
        {id: 103, city: '屏東縣市', district: '崁頂鄉', car_type: '3.5t', fare: '1400'},
        {id: 104, city: '屏東縣市', district: '崁頂鄉', car_type: '6.8t', fare: '1950'},
        {id: 105, city: '屏東縣市', district: '新園鄉', car_type: '3.5t', fare: '1200'},
        {id: 106, city: '屏東縣市', district: '新園鄉', car_type: '6.8t', fare: '1800'},
        {id: 107, city: '屏東縣市', district: '東港鎮', car_type: '3.5t', fare: '1300'},
        {id: 108, city: '屏東縣市', district: '東港鎮', car_type: '6.8t', fare: '2000'},
        {id: 109, city: '屏東縣市', district: '南州鄉', car_type: '3.5t', fare: '1600'},
        {id: 110, city: '屏東縣市', district: '南州鄉', car_type: '6.8t', fare: '2300'},
        {id: 111, city: '屏東縣市', district: '新碑鄉', car_type: '3.5t', fare: '1800'},
        {id: 112, city: '屏東縣市', district: '新碑鄉', car_type: '6.8t', fare: '2600'},
        {id: 113, city: '屏東縣市', district: '林邊鄉', car_type: '3.5t', fare: '1400'},
        {id: 114, city: '屏東縣市', district: '林邊鄉', car_type: '6.8t', fare: '2200'},
        {id: 115, city: '屏東縣市', district: '枋寮鄉', car_type: '3.5t', fare: '1900'},
        {id: 116, city: '屏東縣市', district: '枋寮鄉', car_type: '6.8t', fare: '2500'},
        {id: 117, city: '屏東縣市', district: '春日鄉', car_type: '3.5t', fare: '2000'},
        {id: 118, city: '屏東縣市', district: '春日鄉', car_type: '6.8t', fare: '2800'},
        {id: 119, city: '屏東縣市', district: '枋山鄉', car_type: '3.5t', fare: '2100'},
        {id: 120, city: '屏東縣市', district: '枋山鄉', car_type: '6.8t', fare: '2900'},
        {id: 121, city: '屏東縣市', district: '獅子鄉', car_type: '3.5t', fare: '2300'},
        {id: 122, city: '屏東縣市', district: '獅子鄉', car_type: '6.8t', fare: '3200'},
        {id: 123, city: '屏東縣市', district: '牡丹鄉', car_type: '3.5t', fare: '3300'},
        {id: 124, city: '屏東縣市', district: '牡丹鄉', car_type: '6.8t', fare: '4600'},
        {id: 125, city: '屏東縣市', district: '車城鄉', car_type: '3.5t', fare: '2700'},
        {id: 126, city: '屏東縣市', district: '車城鄉', car_type: '6.8t', fare: '3750'},
        {id: 127, city: '屏東縣市', district: '恆春鎮', car_type: '3.5t', fare: '3000'},
        {id: 128, city: '屏東縣市', district: '恆春鎮', car_type: '6.8t', fare: '4200'},
        {id: 129, city: '屏東縣市', district: '滿洲鄉', car_type: '3.5t', fare: '3500'},
        {id: 130, city: '屏東縣市', district: '滿洲鄉', car_type: '6.8t', fare: '4900'},
        {id: 131, city: '屏東縣市', district: '佳冬鄉', car_type: '3.5t', fare: '1900'},
        {id: 132, city: '屏東縣市', district: '佳冬鄉', car_type: '6.8t', fare: '2650'}
    ];
    //出貨單schema
    $scope.order = [
        {
            business_type:'',       //出貨單類型
            delivery_date:'',       //出貨日期
            client_name:'',         //客戶名稱
            order_ID:'',            //出貨單號
            ships:'',               //送貨單 (見下方ships)
            delivery_fee:'',        //運費
            comment:''              //出貨單備註
        }
    ];
    //送貨單schema
    $scope.order.ships = [{
        order_ID:'',
        ship_ID:'',         //送貨單號
        ship_deleted:'',    //此單狀態 (''=正常,'1'=刪除)
        ship_datetime:'',   //送達時間
        contact_info:'',    //客戶連絡電話 or 地址
        ship_area:'',       //縣市
        ship_district:'',   //區域
        driver:'',          //駕駛
        car_type:'',        //車型
        car_ID:'',          //車號
        is_elevator:'',     //是否有搭電梯 (+100)
        floors_byhand:'',   //手搬樓層數 (1樓+100)
        amount_collect:'',  //代收貨款 (現金0.2%手續費，支票無)
        comment:''          //備註
    }];
    //送達時間
    $scope.arrive_time = ['不指定時間','早上6點','早上7點','早上8點','早上9點','早上10點','早上11點','中午12點','下午1點','下午2點','下午3點','下午4點','下午5點','晚上6點','晚上7點','晚上8點','晚上9點','晚上10點'];
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
        $scope.selCity = selectedValue;
        $scope.level2 = arrayDistrict;
    };
    //刪除一筆送貨單
    $scope.deleteShip = function (ship) {
        ship.ship_deleted = "1";
    };
    $scope.addNewShip = function(){
        var new_ship = { 
            ship_ID:'',         //送貨單號
            ship_deleted: '',   //此單狀態 (''=正常,'1'=刪除)
            ship_datetime:'',   //送達時間
            contact_info:'',    //客戶連絡電話 or 地址
            ship_area:'',       //縣市
            ship_district:'',   //區域
            driver:'',          //駕駛
            car_type:'',        //車型
            car_ID:'',          //車號
            is_elevator:'',     //是否有搭電梯 (+100)
            floors_byhand:'',   //手搬樓層數 (1樓+100)
            amount_collect:'',  //代收貨款
            comment:''          //備註
        };
        $scope.order.ships.push(new_ship)
    };
    $scope.customFilter = function(obj){
        if(obj.ship_deleted.length == 0)
        {
            return obj;
        }
    }
   
    
    $scope.submitForm = function() {
        var business_type = "郭元益";
        var delivery_date = $scope.order.delivery_date;
        var client_name = "";
        var order_ID = $scope.order.order_ID;
        var delivery_fee = $scope.order.delivery_fee;
        var comment = $('#commentText').val();
        if(this.validateNcal($scope.order)){
            $scope.order.ships.forEach(function(x){
                if(x.ship_deleted == "1" ){
                    return;
                }
                var shipdata = {
                    business_type: business_type,
                    delivery_date: delivery_date,
                    client_name: client_name,
                    order_ID: order_ID,
                    delivery_fee: delivery_fee,
                    comment: comment,
                    ship_ID: x.ship_ID,
                    ship_area: x.ship_area,
                    ship_district: x.ship_district,
                    car_type: x.car_type,
                    ship_datetime: x.ship_datetime,
                    contact_info: x.contact_info,
                    is_elevator: x.is_elevator,
                    floors_byhand: x.floors_byhand,
                    amount_collect: x.amount_collect
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
        }
    alert('新增成功');

        //window.location.reload();
        
    }
});

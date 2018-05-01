    //出貨單schema
var order = [{
        business_type:'',       //出貨單類型
        delivery_date:'',       //出貨日期
        client_name:'',         //客戶名稱
        order_ID:'',            //出貨單號
        car_type:'',            //車型
        car_ID:'',              //車號
        ships:'',               //送貨單 (見下方ships)
        delivery_fee:'',        //運費
        comment:''              //出貨單備註
}];

    //送貨單schema
var ships = [{
    ship_ID:'',         //送貨單號
    ship_orderStore:'', //發單門市
    ship_driver:'',     //司機姓名
    ship_deleted:'',    //此單狀態 (''=正常,'1'=刪除)
    arriveAfter:'',
    arriveBefore:'',
    ship_datetime:'',   //送達時間
    contact_info:'',    //客戶連絡電話 or 地址
    ship_area:'',       //縣市
    ship_district:'',   //區域
    is_elevator:'',     //是否有搭電梯 (+100)
    floors_byhand:'',   //手搬樓層數 (1樓+100)
    amount_collect:'',  //代收貨款 (現金0.2%手續費，支票無)
    comment:''          //備註
}];
    
    //司機名稱
var drivers = [
    '朱晉廷','江明峰','江國銘','呂志偉','李佳憲','林日迴','林麒雄','吳孝豐','高自強',
    '莊羽鴻','莊智翔','郭政峰','陳政裕','陳麒任','楊文忠','韓志華','黃信銨','黃聖文',
    '葉瑞煌','劉永富','鄭文豪','石道純','朱鎮金','宋皇標','林豪群','洪基豪','高才述',
    '張立威','張家豪','張詠鈞','陳明光','陳朝舜','楊宗波','楊宗基','呂梅良','蕭麗鳳','熊勇力'];

    //發單門市
var order_store = [
        '總公司','楊梅廠','中正','鳳山','岡山','屏東',
        '士林','中山','南京','忠孝','公館','三重','板橋','新店','永和',
        '基隆','宜蘭','桃園','中壢','新竹','苗栗',
        '台中三民','豐原','大甲','彰化','員林','嘉義','台南成功','東寧','新營'
    ];
    //運費lookup table
var rawdata = [
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
        {id: 45, city: '高雄市', district: '鳳山區', car_type: '3.5t', fare: '600'},
        {id: 46, city: '高雄市', district: '鳳山區', car_type: '6.8t', fare: '1050'},
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
        {id: 43, city: '高雄市', district: '大社區', car_type: '3.5t', fare: '900'},
        {id: 44, city: '高雄市', district: '大社區', car_type: '6.8t', fare: '1500'},
        {id: 47, city: '高雄市', district: '岡山區', car_type: '3.5t', fare: '900'},
        {id: 48, city: '高雄市', district: '岡山區', car_type: '6.8t', fare: '1500'},
        {id: 49, city: '高雄市', district: '燕巢區', car_type: '3.5t', fare: '900'},
        {id: 50, city: '高雄市', district: '燕巢區', car_type: '6.8t', fare: '1500'},
        {id: 51, city: '高雄市', district: '旗山區', car_type: '3.5t', fare: '1300'},
        {id: 52, city: '高雄市', district: '旗山區', car_type: '6.8t', fare: '1800'},
        {id: 53, city: '高雄市', district: '美濃區', car_type: '3.5t', fare: '1400'},
        {id: 54, city: '高雄市', district: '美濃區', car_type: '6.8t', fare: '2100'},
        {id: 37, city: '高雄市', district: '彌陀區', car_type: '3.5t', fare: '900'},
        {id: 38, city: '高雄市', district: '彌陀區', car_type: '6.8t', fare: '1500'},
        {id: 41, city: '高雄市', district: '永安區', car_type: '3.5t', fare: '1100'},
        {id: 42, city: '高雄市', district: '永安區', car_type: '6.8t', fare: '1700'},
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
        {id: 101, city: '屏東縣市', district: '潮州鎮', car_type: '3.5t', fare: '1700'},
        {id: 102, city: '屏東縣市', district: '潮州鎮', car_type: '6.8t', fare: '2400'},
        {id: 107, city: '屏東縣市', district: '東港鎮', car_type: '3.5t', fare: '1300'},
        {id: 108, city: '屏東縣市', district: '東港鎮', car_type: '6.8t', fare: '2000'},
        {id: 127, city: '屏東縣市', district: '恆春鎮', car_type: '3.5t', fare: '3000'},
        {id: 128, city: '屏東縣市', district: '恆春鎮', car_type: '6.8t', fare: '4200'},
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
        {id: 103, city: '屏東縣市', district: '崁頂鄉', car_type: '3.5t', fare: '1400'},
        {id: 104, city: '屏東縣市', district: '崁頂鄉', car_type: '6.8t', fare: '1950'},
        {id: 105, city: '屏東縣市', district: '新園鄉', car_type: '3.5t', fare: '1200'},
        {id: 106, city: '屏東縣市', district: '新園鄉', car_type: '6.8t', fare: '1800'},
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
        {id: 129, city: '屏東縣市', district: '滿洲鄉', car_type: '3.5t', fare: '3500'},
        {id: 130, city: '屏東縣市', district: '滿洲鄉', car_type: '6.8t', fare: '4900'},
        {id: 131, city: '屏東縣市', district: '佳冬鄉', car_type: '3.5t', fare: '1900'},
        {id: 132, city: '屏東縣市', district: '佳冬鄉', car_type: '6.8t', fare: '2650'}
    ];
    //送達時間
var arriveAfter = [
        { hour:0,time:'不指定'},
        { hour:8,time:'08:00'},
        { hour:9,time:'09:00'},
        { hour:10,time:'10:00'},
        { hour:11,time:'11:00'},
        { hour:12,time:'12:00'},
        { hour:13,time:'13:00'},
        { hour:14,time:'14:00'},
        { hour:15,time:'15:00'},
        { hour:16,time:'16:00'},
        { hour:17,time:'17:00'},
        { hour:18,time:'18:00'},
        { hour:19,time:'19:00'},
        { hour:20,time:'20:00'},
        { hour:21,time:'21:00'},
        { hour:22,time:'22:00'}
    ];
var arriveBefore = [
        { hour:0,time:'不指定'},
        { hour:8,time:'08:00'},
        { hour:9,time:'09:00'},
        { hour:10,time:'10:00'},
        { hour:11,time:'11:00'},
        { hour:12,time:'12:00'},
        { hour:13,time:'13:00'},
        { hour:14,time:'14:00'},
        { hour:15,time:'15:00'},
        { hour:16,time:'16:00'},
        { hour:17,time:'17:00'},
        { hour:18,time:'18:00'},
        { hour:19,time:'19:00'},
        { hour:20,time:'20:00'},
        { hour:21,time:'21:00'},
        { hour:22,time:'22:00'}
    ];

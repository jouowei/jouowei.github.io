//司機名稱
var drivers = [
    '朱晉廷','江明峰','江國銘','呂志偉','李佳憲','李明正','林日迴','林麒雄','吳孝豐','高自強',
    '莊羽鴻','莊智翔','郭政峰','陳政裕','陳麒任','楊文忠','鄭文豪','韓志華','黃信銨','黃聖文',
    '葉瑞煌','劉永富','石道純','朱鎮金','宋皇標','林豪群','洪基豪','高才述',
    '張立威','張家豪','張詠鈞','陳明光','陳朝舜','楊宗波','楊宗基','呂梅良','蕭麗鳳','熊勇力'];
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

function randomWord(max){
    var str = "",
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for(var i=0; i<max; i++){
        pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
}
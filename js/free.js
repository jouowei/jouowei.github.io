(function() {

  window.startFill=function (name) { 
   // ga('send', 'event', 'action', name);
  };

 window.submitClicked = function(mode) { 
  var phone_number, name, email, textContactTime,whosFriend,relation,toCome,address,participants,foodPreference,message;
  document.getElementById("submit").src="image/start.jpg";
  name = $('#InputName').val().replace(/(^\s+)|(\s+$)/g,"");
  if (name == "" || name.length > 6) {
      alert('請填寫有效姓名');
      document.getElementById("InputName").focus();
      document.getElementById("submit").src="image/btn.jpg";
      return false;
  }
  phone_number = $('#InputPhone').val().replace(/[^\d]/g, '');
  if (phone_number.indexOf('09') !== 0 || phone_number.length !==10) {
    alert('請確認您的手機號碼');
    document.getElementById("InputPhone").focus();
    document.getElementById("submit").src="image/btn.jpg";
    return false;
  }
  email = $('#InputEmail').val();
  /*if (email.indexOf('@') == -1 ) {
      alert('請確認您的Email');
      return false;
  }   */
  whosFriend = $('#whosFriend').val();
  if (whosFriend.length ==0)
  {
    alert('請選擇是男方還是女方的朋友');
    document.getElementById("whosFriend").focus();
    document.getElementById("submit").src="image/btn.jpg";
    return false;
  } 
  relation = $('#InputRelation').val();
  if (relation.length ==0)
  {
    alert('請選擇關係');
    document.getElementById("InputRelation").focus();
    document.getElementById("submit").src="image/btn.jpg";
    return false;
  } 
  toCome = $('#InputCome').val();
  address = $('#address').val();
  participants = $('#Participants').val();
  foodPreference = $('#FoodPreference').val();
  message = $('#message').val();
  if (toCome.length ==0)
  {
    alert('請選擇是否要參加/索取喜帖');
    document.getElementById("InputCome").focus();
    document.getElementById("submit").src="image/btn.jpg";
    return false;
  } 
  else if(toCome != "NO"){
    if (address.length ==0)
    {
      alert('請填入喜帖寄送地址');
      document.getElementById("address").focus();
      document.getElementById("submit").src="image/btn.jpg";
      return false;
    } 
  }
  else if(toCome == "YES"){
    if (participants.length ==0)
    {
      alert('請選擇參加人數');
      document.getElementById("Participants").focus();
      document.getElementById("submit").src="image/btn.jpg";
      return false;
    } 
  }
  if (message.length ==0)
  {
    alert('說句話再走嘛~');
    document.getElementById("message").focus();
    document.getElementById("submit").src="image/btn.jpg";
    return false;
  } 

//  ga('send', 'conversion', 'conversion', 'submit');
  return submitRegistration( name, phone_number,email,whosFriend,relation,toCome,address,participants,foodPreference,message);  
  };
  
  /*
  window.submitForm=function(shipdata) {
    
    var jqxhr;
    var TYPE1_SUBMIT_FORM_API = "https://script.google.com/macros/s/AKfycbzomZj2EcfrQPU1bZsGLjlwINtcPSJ9fxk4ZA2NYy8mb1rH3iw/exec";
    return jqxhr = $.post(TYPE1_SUBMIT_FORM_API,shipdata).done(function() {
        if (jqxhr.status === 200) {
          //window.location.href = "thankyou.html"
        } 
        else {
          return alert('網路連線問題，請再試一次');
        }
    });
    alert('新增成功');
  };
*/
}).call(this);


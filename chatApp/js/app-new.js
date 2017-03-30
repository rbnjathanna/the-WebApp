var img_url="";var name, email, photoUrl, uid, emailVerified;var fullname="";var file="";

var chatApp= angular.module("myApp", ['ngMaterial','ngRoute','firebase','ngProgress','ismobile']);

chatApp.config(['$routeProvider','isMobileProvider',function($routeProvider,isMobile){
    $routeProvider
        /*.when('/profile',{
            templateUrl:'profile.html',
            controller:'profileCtrl'
        })*/
        .when('/',{
            templateUrl:'login.html',
            controller:'parentCtrl'
        })
        .when('/register',{
            templateUrl:'register.html',
            controller:'registerCtrl'
        })
        .when('/chatRoom/:username/:displayname/:uid',{
            templateUrl:'chatroom.html',
            controller:'chatroomCtrl'
        })
        .otherwise({
          redirectTo: '/'
        });
}])

function uploadedChanged(){
    img_url="",file="";
    file = document.getElementById("upload_btn").files[0];
    var readImg = new FileReader();
    readImg.readAsDataURL(file);
    readImg.onload = function (e) {
        $('.img-circle').attr('src', e.target.result).fadeIn();
        img_url=e.target.result;      
    } 
}   

chatApp.factory('Message', ['$firebase','$mdDialog',
	function($firebase,$mdDialog) {
		var ref = new Firebase('https://my-chatapp-a7fa0.firebaseio.com');
		var messages = $firebase(ref.child('messages')).$asArray();
        console.log($firebase(ref.child('messages')).$asArray());
		var Message = {
			all: messages,
            ref : new Firebase('https://my-chatapp-a7fa0.firebaseio.com'),
			create: function (message) {
				return messages.$add(message);
			},
			get: function (messageId) {
				return $firebase(ref.child('messages').child(messageId)).$asObject();
			},
			delete: function (message) {
				return messages.$remove(message);
			},
            user:{username:"",name:"",email:"",photourl:"",emailVerified:"",uid:""},
            self:"false",
            login:"false",
            photoURL:'',
            showAlert : function(text) {
                $mdDialog.show(
                  $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .textContent(text)
                    .ok('Ok')
                );
            },
            validation:function (formName){
                var emptyField=0,element=[];
                $('#'+formName+' input.required').each(function(){
                    var text = $(this).parents('.required_field').find('label').text();
                    var id = $(this).attr("id");    
                    if($("#"+id).val()==''){
                        $("#"+id).addClass("error");
                        $(this).parents('.required_field').find(".errorMsg").html(text+" is required");
                        $(this).parents('.required_field').find('.label').addClass("error");
                        element.push(id);
                        emptyField++;
                    }else{
                        $("#"+id).removeClass("error");
                        $(this).parents('.required_field').find(".errorMsg").html("");
                        $(this).parents('.required_field').find('label').removeClass("error");
                    }                  
                })
                if(emptyField==0){       
                    return true;
                }else{
                    $("#"+element[0]).focus();
                    return false;
                }
            }
		};
 
		return Message;
 
	}
]);

chatApp.run(function($rootScope,ngProgressFactory){
    $rootScope.progressbar = ngProgressFactory.createInstance();			
    $rootScope.$on('$routeChangeStart', function () {
        $rootScope.progressbar.start();
    });			
    $rootScope.$on('$routeChangeError', function () {
        $rootScope.progressbar.complete();
    });			
    $rootScope.$on('loading:progress', function (){
        $rootScope.progressbar.start(); 				
    });
    $rootScope.$on('loading:finish', function (){
        $rootScope.progressbar.complete();
    });
    $rootScope.$on('loading:unappear', function (){
        $rootScope.progressbar.reset();
    });
});

chatApp.factory('httpInterceptor', ['$q', '$rootScope',function ($q, $rootScope) {
        var loadingCount = 0;
        return {
            request: function (config) {
                if(++loadingCount === 1) $rootScope.$broadcast('loading:progress');
                return config || $q.when(config);
            },
            response: function (response) {
                if(--loadingCount === 0) $rootScope.$broadcast('loading:finish');
                return response || $q.when(response);
            },
            responseError: function (response) {
                if(--loadingCount === 0) $rootScope.$broadcast('loading:finish');
                return $q.reject(response);
            }
        };
    }
]).config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
}]);

chatApp.controller('parentCtrl',function($http,$scope,$mdDialog,Message,$timeout){
    $("#toggle_menu").hide();
    
    $scope.openMenu = function($mdOpenMenu, ev) {
      $mdOpenMenu(ev);
    };
    
    $scope.signOut=function(){
        Message.login="false";
         $('html body').animate({scrollTop:0},'fast');
        firebase.auth().signOut().then(function() {
           Message.showAlert("Logged out successfully",""); 
           $timeout( function(){
               $mdDialog.hide();
                window.location="#/";
            }, 3000 ); 
        }).catch(function(error) {
           Message.showAlert(error.message);
        });
    }

    $scope.signIn=function(){
        var email=$scope.uname+"@webchat.com";
        var password="password";
        if(Message.validation("login")){
            firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(response){
                $scope.login="true";
                console.log($scope.login);
                Message.login="true";
                Message.user=$scope.uname;
                //loggedUser
                var user = firebase.auth().currentUser;
                if (user != null) {
                    Message.user={                 
                          username:$scope.uname, 
                          name:user.displayName,
                          //email:user.email, 
                          //photourl:user.photoURL,
                          //emailVerified:user.emailVerified,
                          uid:user.uid
                    };
                    
                    window.location=window.location.pathname+"#/chatRoom/"+$scope.uname+"/"+user.displayName+"/"+user.uid;
                }
            }).catch(function(error) {
                  if(error.message=="EMAIL_NOT_FOUND"){
                         Message.showAlert("The entered username does not exist.")
                  }else{
                      Message.showAlert(error.message);                     
                  }
            });     
        } 
    }
});

chatApp.controller('homeCtrl',function($http,$scope){
    
});

chatApp.controller('loginCtrl',function($scope,Message) {
    
});


chatApp.controller("registerCtrl", ["$scope", "$firebaseAuth","Message","$timeout","$mdDialog",
  function($scope, $firebaseAuth,Message,$timeout,$mdDialog) {
        $("#toggle_menu").hide();
        $scope.login="false";
        $scope.register=function(){
           if(Message.validation("register")){
               var email=$scope.uname+"@webchat.com";
               var password="password";
               firebase.auth().createUserWithEmailAndPassword(email, password)
               .then(function(response){                                   
                   var user = firebase.auth().currentUser;
                   user.updateProfile({
                      displayName: $scope.fname+" "+$scope.lname,
                      photoURL: img_url
                    }).then(function(response) {
                       Message.photoURL=img_url;
                      var displayName = user.displayName;
                      var photoURL = user.photoURL;
                       Message.showAlert("Successfully registered!","");
                       $timeout( function(){
                           $mdDialog.hide();
                            window.location="#/";
                        }, 3000 );                     
                    }, function(error) {
                      Message.showAlert(error.message);
                    });
               }).catch(function(error){
                    var errorCode = error.code;
                    var errorMessage = error.message;
                   if(errorCode=="auth/email-already-in-use"){
                       Message.showAlert("The entered username "+$scope.uname+" is already in use.");
                   }else{
                       Message.showAlert(errorMessage);
                   }
                });
           }        
       }
     
        $scope.triggerTypeFile=function(){
            $("#upload_btn").trigger("click");
        }     
  }
]);

chatApp.controller('chatroomCtrl', ['$scope','Message','isMobile','$location','$routeParams', function($scope,Message,isMobile,$location,$routeParams){
        $("#toggle_menu").show();
        Message.login="true";;
        $scope.messages= Message.all;
        $scope.loggedUser=$routeParams.username;
        $scope.inserisci = function(text){
            if(text==""|| text==undefined){
                Message.showAlert("Enter valid text");
            }else{
                var message={};
                Message.self="true";
                message.text=text;
                message.user=$routeParams.username;
                message.uid=$routeParams.uid;
                $scope.text="";
                Message.create(message);
            }
        };
        if(isMobile.phone){
            $scope.mobile="true";
            setTimeout(function(){
                $("#swipeleft").show();
                $("#swiperight").hide();
                $("#swipeleft").css('width','100%');
                var ht=$(window).height()-110;
                $("#displayMsg").css({'max-height':ht+"px",'overflow':'auto','height':ht+"px"});
            },1000)                      
            $scope.onSwipe=function(page1,page2){
                $("#"+page1).animate({right: "+=100%"},'500', function(){$(this).hide();});
                $("#"+page2).animate({left: "+=100%"},'500', function() {$(this).show();});
            }         
        }else{
            $scope.mobile="false";
            setTimeout(function(){
                $('html body').animate({scrollTop:0},'fast');
                $(".main_div").css({'height':'100%','margin-top':'60px'});                
                 $("#desktop_div").css('height','100%'); 
                var ht=$(window).height()-110;
                $("#displayMsg").css({'max-height':ht+"px",'overflow':'auto'});
                $('body').css('overflow','auto');
            },1000)   
        }   
    
}]);

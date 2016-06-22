import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';

//make the rooms collection
Rooms = new Meteor.Collection('rooms');


///////////////////////////////////////////////////////////////////////////////////////////
//Routes for variouss templates                                                          //
///////////////////////////////////////////////////////////////////////////////////////////

//route for static index
Router.route('/', function () {
	this.render('index');
});
//route for addRoom template
Router.route('/addRoom', function () {
	this.render('addRoom');
});
//route for join template
Router.route('/joinRoom', function () {
	this.render('joinRoom');
});
//route for join with roomID parameter
Router.route('/joinRoom/:_id', function () {   
	this.render('joinRoom');
});
//route for displayRoom template 
Router.route('/room/:_id/:personID', function () {
	var params = this.params;
	var roomID = params._id;
	var personID = params.personID;
	
    //subscribe to public room info
    Meteor.subscribe("publicRoomInfoByRoomID", roomID.toString());

	Meteor.call('hasSubmitted', roomID, personID, function (err, hasSubmitted) {
        if (hasSubmitted) {
            Session.set('showSubmit',false);
        }
        else {
	        Session.set('showSubmit',true);
        }
	});
    
	this.render("displayRoom");
});
//rout for the admin management template 
Router.route('/manageRoom/:_id', function () {
  var params = this.params;
  var adminKey = params._id;
  Meteor.subscribe("publicRoomInfoByAdminKey", adminKey.toString());

  this.render("manageRoom");
});
//route for static about template 
Router.route('/about', function () {
  this.render('about');
});



///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the addRoom template                                            //
///////////////////////////////////////////////////////////////////////////////////////////

//events for addRoom
Template.addRoom.events({
	
	//a submission event
	'click .submit': function () {
		//get the roomID
		var getRoomSize = $('.room-size').val();
		//get the roomAdmin
		var getRoomAdmin = $('.room-admin').val();
		//get the number of options
		var optionsCount = $('.options-count').val();
		//generate the admin key, create the room, and redirect to new room
		var adminKey = "";
		Meteor.call("stringGen", 14, function(error, result){
			if(error){
				console.log(error);
			} else {
				console.log(result);
				Meteor.call("insert", getRoomAdmin, getRoomSize, result, optionsCount);		
				window.location.href = '/manageRoom/' + result;    
      		}
   		})
	},
});



///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the displayRoom template                                        //
///////////////////////////////////////////////////////////////////////////////////////////	
	
//helpers for displaying the room
Template.displayRoom.helpers({
	//display roomCode from method call
	roomCode: function () {
		var params =  Router.current().params;			
		Meteor.call("getRoomIDByRoomID", params._id.toString(), function(error, result){
			Session.set('roomID', result);
    	});
		return Session.get('roomID');
	},
	//display admin name from method call
	adminName: function () {
		var params =  Router.current().params;			
		Meteor.call("getRoomAdminByRoomID", params._id.toString(), function(error, result){
			Session.set('adminName', result);
    	});
		return Session.get('adminName');
	},
	//display admin name from method call
	personName: function () {
		var params =  Router.current().params;			
		Meteor.call("getPersonName", params.personID.toString() ,params._id.toString(), function(error, result){
			Session.set('personName', result);
    	});
		return Session.get('personName');
	},
	//display roomMembers from method call
	roomData: function () {
		return Rooms.findOne().peopleArr;
	},
	//displays the room size from subscribed data
	roomSize: function () {
		return Rooms.findOne().roomSize;
	},
	//displays the room size from url parameter
	personID: function () {
		var params =  Router.current().params;			
   		return params.personID.toString();
	},
	//displays the room size from method call
	optionsCount: function () {
		var params =  Router.current().params;			
		return ReactiveMethod.call("getOptionsCountByRoomID", params._id.toString());
	},
	//displays or doesn't display the submission option
	showSubmit:function(){
        return Session.get('showSubmit')
    },
});
    
//events for displayRoom
Template.displayRoom.events({
	
	//a submission event
	'click .submit': function () {
		
		//basic isInt function to check the validity of integer
		function isInt(value){ 
			if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
				return true;
			} else { 
				return false;
	  		} 
		}
		
		//basic string generation function that generates a random alphanumeric string
		function stringGen(len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    	}
				
		//get the roomID
		var submittedBit = $('.selectedOption').val();
		
		var personID = Router.current().params.personID;
		var roomID = Router.current().params._id;
		
		//if is it not null
		if (submittedBit !== "" || submittedBit !== null) {
			//if it is an integer 
			if (isInt(submittedBit)){
				//if it is within the given range
				if(submittedBit <= parseInt(Rooms.findOne().optionsCount) && submittedBit >= 1){
					var randomBits = stringGen(8);
					var submittedBit= submittedBit - 1;
					var hashedBits = CryptoJS.SHA256(submittedBit.toString() + randomBits).toString();
					Meteor.call("submitHashByPersonID", roomID.toString(), personID.toString(), randomBits, submittedBit, hashedBits);
					location.reload();
				}	
				else {
					alert("You must enter an integer within the given range");
				}		
			}
			else {
				alert("You must enter an integer");
			}
		}
		else {
			alert("You must enter an integer");
		}
	},
}); 
    
///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the manageRoom template                                         //
///////////////////////////////////////////////////////////////////////////////////////////	
	
Template.manageRoom.helpers({  
	//display roomCode
	roomCode: function () {
		var params =  Router.current().params;			
    	return ReactiveMethod.call("getRoomIDByAdminKey", params._id.toString());					
	},
	//display adminLink
	adminKey: function () {
		var params =  Router.current().params;
		Meteor.call("getRoomAdminKey", params._id.toString(), function(error, result){
			Session.set('adminKey', result);
    	});
    	//return current url and the admin link
    	var adminKey = Session.get('adminKey');
		var url = location.origin = location.protocol + "//" + location.host;	
		return url + "/manageRoom/" + adminKey;
	},
	//display roomID
	joinLink: function () {
		var params =  Router.current().params;	
		Meteor.call("getRoomIDByAdminKey", params._id.toString(), function(error, result){
			Session.set('roomID', result);
    	});	
		var getRoomLink = Session.get('roomID');
		var url = location.origin = location.protocol + "//" + location.host;	
		return url + "/joinRoom/" + getRoomLink;
	},
	//display admin name
	adminName: function () {
		var params =  Router.current().params;			
    	return ReactiveMethod.call("getRoomAdminByAdminKey", params._id.toString());
	},
	//display roomMembers
	roomData: function () {
		return Rooms.findOne().peopleArr;
	},
	roomSize: function () {
		return Rooms.findOne().roomSize;
	},
});
    
    

///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the joinRoom template                                           //
///////////////////////////////////////////////////////////////////////////////////////////
    
Template.joinRoom.helpers({
    getId: function () {
		var params =  Router.current().params;
		return params && params._id ? params._id : '';
	}
});


Template.joinRoom.events({
	'click .submit': function () {
		//get the roomID
		var getRoomID = $('.joinID').val();
		//get the roomID
		var newRoomMember = "" + $('.memberName').val();
		Meteor.call("addNewMember", getRoomID, newRoomMember, function(error, result){
			window.location.href = '/room/' + getRoomID + "/" + result;
    	});
	}
});
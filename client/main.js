//TODO LIST
//- Duplicate Protections (A Person Joining Twice)
//- Database Security 
//- Mobile Formatting (Re-join Link
Rooms = new Meteor.Collection('rooms');

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';

//ROUTES
//main template

Meteor.subscribe("rooms");

Router.route('/', function () {
	this.render('index');
});

//addRoom template
Router.route('/addRoom', function () {
	this.render('addRoom');
});

//join template
Router.route('/joinRoom', function () {
	this.render('joinRoom');
});

//join with shareable url template
Router.route('/joinRoom/:_id', function () {   
	this.render('joinRoom');
});

// display template 
Router.route('/room/:_id/:personID', function () {
	//window.onbeforeunload = function() {
	//	return "Leaving this page will abort the Room. Other Room Memebers will be able to see it was you that left. Do you want to continue?";
	//}

	var params = this.params;
	var roomID = params._id;
    
	this.render("displayRoom");
});

// display admin template 
Router.route('/manageRoom/:_id', function () {
  var params = this.params;
  var adminKey = params._id;
  this.render("manageRoom");
});

//about template 
Router.route('/about', function () {
  this.render('about');
});

//make sure you're client side
if (Meteor.isClient) {
	
	//events for creating a room
	Template.addRoom.events({
		'click .submit': function () {
			
			//get the roomID
			var getRoomSize = $('.room-size').val();
			
			var getRoomAdmin = $('.room-admin').val();
			
			var optionsCount = $('.options-count').val();
			
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
	
	Template.displayRoom.helpers({
		//display roomCode
		roomCode: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomIDByRoomID", params._id.toString(), function(error, result){
				Session.set('roomID', result);
    		});
					
			return Session.get('roomID');
		},
		//display admin name
		adminName: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomAdminByRoomID", params._id.toString(), function(error, result){
				Session.set('adminName', result);
    		});
					
			return Session.get('adminName');
		},
		//display roomMembers
		roomData: function () {
			var params =  Router.current().params;		
			return ReactiveMethod.call("getRoomDataArrByRoomID", params._id.toString());
		},
		roomSize: function () {
			var params =  Router.current().params;	
			return ReactiveMethod.call("getRoomSizeByRoomID", params._id.toString());
		},
		personID: function () {
			var params =  Router.current().params;			
   			return params.personID.toString();
		},
		options: function () {
			var params =  Router.current().params;			
			
			return ReactiveMethod.call("getOptionsCountByRoomID", params._id.toString());
		}
    });

		
	Template.manageRoom.helpers({  
		//display roomCode
		roomCode: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomIDByAdminKey", params._id.toString(), function(error, result){
				Session.set('roomID', result);
    		});
					
			return Session.get('roomID');
		},
		//display adminLink
		adminKey: function () {
			var params =  Router.current().params;
				
			Meteor.call("getRoomAdminKey", params._id.toString(), function(error, result){
				Session.set('adminKey', result);
    		});
    		
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
			Meteor.call("getRoomAdminByAdminKey", params._id.toString(), function(error, result){
				Session.set('adminName', result);
    		});
					
			return Session.get('adminName');
		},
		//display roomMembers
		roomData: function () {
			var params =  Router.current().params;		
			return ReactiveMethod.call("getRoomDataArrByAdminKey", params._id.toString());
		},
		roomSize: function () {
			var params =  Router.current().params;	
			return ReactiveMethod.call("getRoomSizeByAdminKey", params._id.toString());
		},
    });
    
    Template.displayRoom.events({
		'click .refresh': function () {
			if (window.location.href.toString().indexOf("#roomMemebers") > -1) {
				location.reload();
			}
			else {
				location.reload();
				window.location.href = window.location.href + "#roomMemebers";
			}
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
    
    Template.joinRoom.helpers({
        getId: function () {
			var params =  Router.current().params;
			return params && params._id ? params._id : '';
		}
    });
}
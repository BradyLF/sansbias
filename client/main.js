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
Router.route('/room/:_id', function () {
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
		}
	});
	
	Template.manageRoom.helpers({  
		//display roomCode
		roomCode: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomID", params._id.toString(), function(error, result){
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
			
			Meteor.call("getRoomID", params._id.toString(), function(error, result){
				Session.set('roomID', result);
    		});
					
			var getRoomLink = Session.get('roomID');
			var url = location.origin = location.protocol + "//" + location.host;	
			return url + "/joinRoom/" + getRoomLink;
		},
		//display admin name
		adminName: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomAdmin", params._id.toString(), function(error, result){
				Session.set('adminName', result);
    		});
					
			return Session.get('adminName');
		},
		//display roomMembers
		roomMembers: function () {
			var params =  Router.current().params;			
			Meteor.call("getNames", params._id.toString(), function(error, result){
				Session.set('roomMembers', result);
    		});
			return Session.get('roomMembers');
		},
		memberSubmission: function () {
			var params =  Router.current().params;			
			Meteor.call("getHashes", params._id.toString(), function(error, result){
				Session.set('memberSubmission', result);
    		});
			return Session.get('memberSubmission');
		},
		roomSize: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomSize", params._id.toString(), function(error, result){
				Session.set('roomSize', result);
    		});
   			return Session.get('roomSize');
		},
		roomCapacity: function () {
			var params =  Router.current().params;			
			Meteor.call("getRoomCapacity", params._id.toString(), function(error, result){
				Session.set('roomCapacity', result);
    		});
   			return Session.get('roomCapacity');
		},
    });
    
    Template.joinRoom.events({
		'click .submit': function () {
			
			//get the roomID
			var getRoomID = $('.joinID').val();
			
			//get the roomID
			var newRoomMember = "" + $('.memberName').val();
			
			Meteor.call("addNewMember", getRoomID, newRoomMember);
			
			//window.location.href = '/room/' + getRoomID;
		}
	});
    
    Template.joinRoom.helpers({
        getId: function () {
			var params =  Router.current().params;
			return params && params._id ? params._id : '';
		}
    });
}
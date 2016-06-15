//TODO LIST
//- Duplicate Protections (A Person Joining Twice)
//- Database Security 
//- Mobile Formatting (Re-join Link


import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';


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
  var params = this.params;
  var roomID = params._id;
  
  console.log(roomID);
  
  this.render("displayRoom");
});

// display admin template 
Router.route('/manageRoom/:_id', function () {
  var params = this.params;
  var roomID = params._id;
  this.render("manageRoom");
});

//about template 
Router.route('/about', function () {
  this.render('about');
});

//make sure you're client side
if (Meteor.isClient) {
		
	//events for the creation of a room
	Template.addRoom.events({
		'click .submit': function () {
			//get the options list
			var options = $('.optionsList').val();
			
			//get creator of room
			var admin = $('.adminName').val();
			
			//get room name
			var roomName = $('.roomName').val();
			
			//make an array of the rooms members
			var members = [admin];
			
			//boolean of whether or not the room is open
			var isOpen = true;
			
			//timestamp on submit
			var timeStamp = Math.floor(Date.now() / 1000);
			
			//funtion that generates a random alphanumeric code
			function stringGen(len){
				var text = "";
				var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
				for( var i=0; i < len; i++ )
					text += charset.charAt(Math.floor(Math.random() * charset.length));
				return text;
				}
			
			//add relevant infor to collection
			Rooms.insert({
				optionsList: options,
				optionsArr: options.split(','),
				admin: admin,
				adminKey: stringGen(10),
				membersArr: members,
				roomName: roomName,
				isOpen: isOpen,
				finalChoice: "A choice will be made when the room is closed",
				timeStamp: timeStamp
			});
			
			//clears text fields
			$('.optionsList').val('');
			$('.adminName').val('');
			
			//displays the newly generated roomID
			var newRoomID = Rooms.findOne({}, {sort: {timeStamp: -1}});
			window.location.href = '/manageRoom/' + newRoomID.adminKey.toString();
		}
	});
	
	//events for joining a room
	Template.joinRoom.events({
		'click .submit': function () {
			
			//get the roomID
			var getRoomID = $('.joinID').val();
			
			//get the roomID
			var newRoomMember = " " + $('.memberName').val();
			
			//add new member
			var newArr = Rooms.findOne({_id: getRoomID}).membersArr;

			//TODO: check if person is already in room

			//updates the rooms members
			newArr.push(newRoomMember);
			Rooms.update(
				{ "_id" : getRoomID },
				{ $set: { "membersArr" : newArr } }
			);
			window.location.href = '/room/' + getRoomID;
		}
	});
	
	
	//get parameters in a join url
	Template.joinRoom.helpers({
        getId: function () {
			var params =  Router.current().params;
			return params && params._id ? params._id : '';
		}
    });
    
    //manage admin tools for mangageRoom Template
    Template.manageRoom.events({
		'click .delete': function () { 
			var getAdminLink = window.location.href;
			var adminKey = getAdminLink.substring(getAdminLink.length-10, getAdminLink.length);
			var getRoomID = Rooms.findOne({adminKey: adminKey})._id.toString();	
			console.log(getRoomID);
			Rooms.remove(getRoomID);
			window.location.href = '/';
		},
		
		'click .closeRoom': function () { 
			//get the admin key
			var getAdminLink = window.location.href;
			var adminKey = getAdminLink.substring(getAdminLink.length-10, getAdminLink.length);
			
			//get roomID based on admin key
			var getRoomID = Rooms.findOne({adminKey: adminKey})._id.toString();	

			//select random item from array	
			var options = Rooms.findOne({_id: getRoomID}).optionsArr;
			var finalChoice = options[Math.floor(Math.random()*options.length)];
			
			var getRoomStatus = Rooms.findOne({adminKey: adminKey}).isOpen;	
			
			if (getRoomStatus) {
				Rooms.update(
					{ "_id" : getRoomID },
					{ $set: { "finalChoice" : finalChoice } }
				);
			
				Rooms.update(
					{ "_id" : getRoomID },
					{ $set: { "isOpen" : false } }
				);
			}
			else {
				window.alert("Room is already closed");
			}
			
		}
	});
    
    //get parameters in a display url
	Template.displayRoom.helpers({
		//display room name
        roomName: function () {
			var params =  Router.current().params;			
			var getRoomName = Rooms.findOne({_id: params._id}).roomName.toString();		
			return getRoomName;
		},
		//display roomID
		roomID: function () {
			var getRoomLink = window.location.href;			
			return getRoomLink;
		},
		//display admin name
		adminName: function () {
			var params =  Router.current().params;			
			var getAdminName = Rooms.findOne({_id: params._id}).admin.toString();		
			return getAdminName;
		},
		//display roomMembers
		roomMembers: function () {
			var params =  Router.current().params;			
			var roomMembers = Rooms.findOne({_id: params._id}).membersArr;
			return roomMembers;
		},
		//display options
		options: function () {
			var params =  Router.current().params;			
			var options = Rooms.findOne({_id: params._id}).optionsArr;
			return options;
		},
		//display final choice
		choice: function () {
			var params =  Router.current().params;			
			var getChoice = Rooms.findOne({_id: params._id}).finalChoice.toString();		
			return getChoice;
		},
    });
	
	//get parameters in a manage url
	Template.manageRoom.helpers({
		//display room name
        roomName: function () {
			var params =  Router.current().params;			
			var getRoomName = Rooms.findOne({adminKey: params._id}).roomName.toString();		
			return getRoomName;
		},
		//display adminLink
		adminLink: function () {
			var getAdminLink = window.location.href;			
			return getAdminLink;
		},
		//display roomID
		joinLink: function () {
			var params =  Router.current().params;			
			var getRoomLink = Rooms.findOne({adminKey: params._id})._id.toString();
			var url = location.origin = location.protocol + "//" + location.host;	
			console.log()	
			return url + "/joinRoom/" + getRoomLink;
		},
		//display room status
		roomStatus: function () {
			var params =  Router.current().params;			
			var getRoomStatus = Rooms.findOne({adminKey: params._id}).isOpen;	
				
			if (getRoomStatus) {
				return "Open"
			}
			return "Closed";
		},
		//display admin name
		adminName: function () {
			var params =  Router.current().params;			
			var getAdminName = Rooms.findOne({adminKey: params._id}).admin.toString();		
			return getAdminName;
		},
		//display roomMembers
		roomMembers: function () {
			var params =  Router.current().params;			
			var roomMembers = Rooms.findOne({adminKey: params._id}).membersArr;
			return roomMembers;
		},
		//display options
		options: function () {
			var params =  Router.current().params;			
			var options = Rooms.findOne({adminKey: params._id}).optionsArr;
			return options;
		},
		//display final choice
		choice: function () {
			var params =  Router.current().params;			
			var getChoice = Rooms.findOne({adminKey: params._id}).finalChoice.toString();		
			return getChoice;
		},
    });
}
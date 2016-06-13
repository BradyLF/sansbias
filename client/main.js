import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import './join.html';

//routes for different templates

//main template
Router.route('/', function () {
  this.render('addRoom');
});

//join template
Router.route('/joinRoom', function () {
  this.render('joinRoom');
});

//TODO: display template 
Router.route('/room/:_id', function () {
  var params = this.params;
  var roomID = params._id; // "5"
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
			
			//make an array of the rooms members
			var members = [admin];
			
			//boolean of whether or not the room is open
			var isOpen = true;
			
			//add relevant infor to collection
			Rooms.insert({
				optionsList: options,
				optionsArr: options.split(','),
				admin: admin,
				membersArr: members,
				isOpen: isOpen,
				finalChoice: "Not Yet Made"
			});
			
			//clears text fields
			$('optionsList').val('');
			$('adminName').val('');
			
			//displays the newly generated roomID
			var newRoomID = Rooms.findOne({}, {fields: {_id: 1}, sort: {_id: 1}});
			document.getElementById("roomID").innerHTML = newRoomID._id.toString()
		}
	});
	
	//events for joining a room
	Template.joinRoom.events({
		'click .submit': function () {
			
			//get the roomID
			var getRoomID = $('.joinID').val();
			
			//get the roomID
			var newRoomMember = $('.memberName').val();
			
			//add new member
			var newArr = Rooms.findOne({_id: getRoomID}).membersArr;
			newArr.push(newRoomMember);

			//updates the rooms members
			Rooms.update(
				{ "_id" : getRoomID },
				{ $set: { "membersArr" : newArr } }
			);
			
		}
	});
	
	//TODO - get room ID from url parameters
	Template.displayRoom.helpers({
		people: function() {
			var getRoomID = $('.joinID').val();
			return Rooms.findOne({_id: "9GAJubXhkd32HKDHb"}).membersArr;
		}
	});
	
	
}
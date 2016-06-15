
//create a new collection of rooms
Rooms = new Meteor.Collection('rooms');

if (Meteor.isServer) {
	
	Meteor.publish('rooms', function() {
		return Rooms.find();
	});
	
	Meteor.publish('addRoom', function publishFunction(options, admin, adminKey, members, roomName, isOpen, finalChoice, timeStamp) {
		//add relevant infor to collection
		Rooms.insert({
			optionsList: options,
			optionsArr: options.split(','),
			admin: admin,
			adminKey: adminKey,
			membersArr: members,
			roomName: roomName,
			isOpen: isOpen,
			finalChoice: "A choice will be made when the room is closed",
			timeStamp: timeStamp
		});
		//var getRoomID = Rooms.findOne({}, {sort: {timeStamp: -1}});
		return Rooms.find();
	});
}
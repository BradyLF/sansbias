import { Meteor } from 'meteor/meteor';


//create a new collection of rooms
Rooms = new Meteor.Collection('rooms');


Meteor.startup(() => {
  // code to run on server at startup
});

//server side
if (Meteor.isServer) {
	
	//Meteor.publish("getRoomByAdminKey", function (adminKey) {
	//    return Rooms.find({adminKey: adminKey}, {fields: {people: 0, adminKey: 0}}, {limit: 1});
	//});
	
	Meteor.publish("rooms", function () {
	    return Rooms.find({});
	});
	

}

Meteor.methods({
	insert:function (roomAdmin, roomSize, adminKey, optionsCount) {
		
		var peopleArr = [
			{
				name: roomAdmin, 
				personID: Meteor.call("stringGen", 6), 
				submitttedBit: null, 
				randomBits: Meteor.call("stringGen", 6), 
				hashedBits: "Waiting for submission..."
			}
		]
		
		var timeStamp = Math.floor(Date.now() / 1000);	
		Rooms.insert({
			roomAdmin: roomAdmin,
			roomSize: 1,
			optionsCount: optionsCount,
			adminKey: adminKey,
			peopleArr: peopleArr,
			timeStamp: timeStamp
		})
    },
    
    stringGen:function (len) {
			var text = "";
			var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    },
    
	getRoomDataArrByAdminKey:function (adminKey){
	    return Rooms.findOne({adminKey: adminKey}).peopleArr;
	},

	getRoomAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).adminKey;
	},
	
	getRoomAdminByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).peopleArr[0].name;
	},
	
	getRoomIDByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey})._id.toString();
	},
	
	getRoomSizeByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).roomSize;
	},
	
	getRoomDataArrByRoomID:function (roomID){
	    return Rooms.findOne({_id: roomID}).peopleArr;
	},
	
	getRoomAdminByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID}).peopleArr[0].name;
	},
	
	getRoomIDByByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID})._id.toString();
	},
	
	getRoomSizeByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID}).roomSize;
	},
	
	getOptionsCountByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID}).optionsCount;
	},
	
	addNewMember:function (roomID, newMemeberName) {
		
	    var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
	    
	    var personID = Meteor.call("stringGen", 6)
	    
	    newPeopleArr.push(
	    		{
					name: newMemeberName, 
					personID: personID, 
					submitttedBit: null, 
					randomBits: Meteor.call("stringGen", 6), 
					hashedBits: "Waiting for submission..."
				});
	    
	    var roomSize = Rooms.findOne({_id: roomID}).roomSize;
	    
	    roomSize++;
	    
		Rooms.update(
				{ "_id" : roomID },
				{ $set: { "peopleArr" : newPeopleArr, "roomSize": roomSize} }
		);
		
		return personID;
	},
});
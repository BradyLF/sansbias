
//create a new collection of rooms
Rooms = new Meteor.Collection('rooms');

//server side
if (Meteor.isServer) {
	
	Meteor.publish("getRoomByAdminKey", function (adminKey) {
	    return Rooms.find({adminKey: adminKey}, {fields: {people: 0, adminKey: 0}}, {limit: 1});
	});
	

}

Meteor.methods({
	insert:function (roomAdmin, roomSize, adminKey, optionsCount) {
		//create new array [[ name | person ID  ,               | bit | random bits                | hashed bit]]
		var peopleArr = [[roomAdmin, Meteor.call("stringGen", 6), null, Meteor.call("stringGen", 6), null]];
		var timeStamp = Math.floor(Date.now() / 1000);	
		Rooms.insert({
			roomAdmin: roomAdmin,
			roomCapacity: roomSize,
			roomSize: 1,
			optionsCount: optionsCount,
			adminKey: adminKey,
			people : peopleArr,
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
    
    getHashes:function (adminKey) {
	    var arrLength = Rooms.findOne({adminKey: adminKey}).people.length;
		var hashes = [];
			
		for (i = 0; i < arrLength; i++) { 
			var hashedBit = Rooms.findOne({adminKey:adminKey}).people[i][4];		
			if (hashedBit == null) {
				hashes.push("Waiting for submission...");
			}
			else {
				hashes.push(Rooms.findOne({adminKey: params._id.toString()}).people[i][4]);
			}
		}			
		return hashes;
	},
	
	getNames:function (adminKey) {
	    var arrLength = Rooms.findOne({adminKey: adminKey}).people.length;
		var names = [];
			
		for (i = 0; i < arrLength; i++) { 
			names.push(Rooms.findOne({adminKey: adminKey}).people[i][0])
		}				
		return names;
	},
	
	getRoomAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).adminKey;
	},
	
	getRoomAdmin:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).people[0][0];
	},
	
	getRoomID:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey})._id.toString();
	},
	
	getRoomSize:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).roomSize;
	},
	
	getRoomCapacity:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).roomCapacity;
	},
	
	addNewMember:function (roomID, newMemeberName) {
		
	    var newMemberArr = [newMemeberName, Meteor.call("stringGen", 6), null, Meteor.call("stringGen", 6), null];
	    
	    
	    var getArr = Rooms.findOne({_id: roomID}).people;
	    
	    
	    getArr.push(newMemberArr);
	    
		Rooms.update(
				{ "_id" : roomID },
				{ $set: { "people" : getArr } }
		);
		
		console.log(Rooms.findOne({_id: roomID}).people);
	},
});
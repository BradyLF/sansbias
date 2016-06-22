import { Meteor } from 'meteor/meteor';

//create a new collection of rooms
Rooms = new Meteor.Collection('rooms');



///////////////////////////////////////////////////////////////////////////////////////////////
//publications of public info, with a passed in roomID or adminKey                           //
///////////////////////////////////////////////////////////////////////////////////////////////

//publish public room info based on roomID
Meteor.publish("publicRoomInfoByRoomID", function (roomID) {
    return Rooms.find({_id: roomID}, {fields: {
	    roomSize: 1, 
	    optionsCount: 1, 
	    "peopleArr.name": 1, 
	    "peopleArr.hasSubmitted": 1, 
	    "peopleArr.hashedBits": 1
	    }});
});
//publish public room info based on adminKey
Meteor.publish("publicRoomInfoByAdminKey", function (adminKey) {
    return Rooms.find({adminKey: adminKey}, {fields: {
	    roomSize: 1,  
	    optionsCount: 1, 
	    "peopleArr.name": 1, 
	    "peopleArr.hasSubmitted": 1, 
	    "peopleArr.hashedBits": 1
	    }});
});


//meteor methods
Meteor.methods({
	
///////////////////////////////////////////////////////////////////////////////////////////
//miscellaneous methods                                                                  //
///////////////////////////////////////////////////////////////////////////////////////////
    
	//basic string generation function that generates a random alphanumeric string
    stringGen:function (len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    },
	
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the addRoom template, which creates a new room based on passed in form data//
///////////////////////////////////////////////////////////////////////////////////////////
    
    //inserts a new document into the collection with passed in parameters
	insert:function (roomAdmin, roomSize, adminKey, optionsCount) {
		//create a new entry into the array with the admin's info
		var peopleArr = [{
				name: roomAdmin, 
				personID: Meteor.call("stringGen", 10), 
				hasSubmitted: false,
				submitttedBit: null, 
				randomBits:  null, 
				hashedBits: "Waiting for all submissions to be made"
			}]
		
		//generate a timeStamp
		var timeStamp = Math.floor(Date.now() / 1000);
		//insert the info into the document	
		Rooms.insert({
			roomAdmin: roomAdmin,
			roomSize: 1,
			optionsCount: optionsCount,
			adminKey: adminKey,
			peopleArr: peopleArr,
			timeStamp: timeStamp,
			finalSum: null,
			allSubmitted: false
		})
    },
    
    
    
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the manageRoom template, which retrieves data with an admin key            //
///////////////////////////////////////////////////////////////////////////////////////////

    //gets an adminKey with an admin key. This code is redudant but it present for consistency's sake
	getRoomAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).adminKey;
	},
	//gets the room admin with an admin key 
	getRoomAdminByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).peopleArr[0].name;
	},
	//gets the room ID with an admin key
	getRoomIDByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey})._id.toString();
	},
	
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the displayRoom template, which retrieves data with an roomID              //
///////////////////////////////////////////////////////////////////////////////////////////
    
    //gets an roomID with a roomID. This code is redudant but it present for consistency's sake
    getRoomIDByByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID})._id.toString();
	},
	//gets the room admin with the roomID
	getRoomAdminByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID}).peopleArr[0].name;
	},
	//gets the person's name with the personID
	getPersonName:function (personID, roomID) {
	    var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = newPeopleArr.length;
		
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				return newPeopleArr[i].name;
			}
		}
	},
	//gets the number range decided upon room creation
	getOptionsCountByRoomID:function (roomID) {
	    return Rooms.findOne({_id: roomID}).optionsCount;
	},
	//updates the submitted hash by a user 
	submitHashByPersonID:function (roomID, personID, randomBits, submitttedBit, hashedBits) {	
		//gets the person arry and its lenght
		var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = newPeopleArr.length;
		
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				//protection against double submission
				if (newPeopleArr[i].hasSubmitted == true){
					break;
				}
				else {
					newPeopleArr[i].randomBits = randomBits;
					newPeopleArr[i].submitttedBit = submitttedBit;
					newPeopleArr[i].hasSubmitted = true;
					newPeopleArr[i].hashedBits = hashedBits;
					break;
				}
			}
		}
		//updates the room
		Rooms.update(
			{ "_id" : roomID },
			{ $set: { "peopleArr" : newPeopleArr} }
		);
	},
	//updates the submitted hash by a user 
	hasSubmitted:function (roomID, personID) {	
		//gets the person arry and its lenght
		var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = peopleArr.length;
		
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (peopleArr[i].personID == personID) {
				//protection against double submission
				if (peopleArr[i].hasSubmitted == true){
					return true;
				}
				else {
					return false;
				}
			}
		}
	},
			
	
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the joinRoom template, which add a new member to a room with a given ID    //
///////////////////////////////////////////////////////////////////////////////////////////
    
    //adds a new room member to an existing room
	addNewMember:function (roomID, newMemeberName) {
		
		//gets the current array from the collection
	    var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
	    //generates a new personID for the newmember
	    var personID = Meteor.call("stringGen", 6)
	    //pushes the new person into the array
	    newPeopleArr.push(
	    	{
				name: newMemeberName, 
				personID: personID, 
				hasSubmitted: false,
				submitttedBit: null, 
				randomBits: null, 
				hashedBits: "Waiting for submission"
			});
	    //gets the current room size, and increases it by one
	    var newRoomSize = Rooms.findOne({_id: roomID}).roomSize + 1;
		//updates the room
		Rooms.update(
			{ "_id" : roomID },
			{ $set: { "peopleArr" : newPeopleArr, "roomSize": newRoomSize} }
		);		
		
		return personID;
	},
});
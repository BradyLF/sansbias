import { Meteor } from 'meteor/meteor';

//create a new collection of rooms
Rooms = new Meteor.Collection('rooms');


///////////////////////////////////////////////////////////////////////////////////////////////
//publications of public info, with a passed in roomID or adminKey                           //
///////////////////////////////////////////////////////////////////////////////////////////////

//publish public room info based on roomID
Meteor.publish("publicRoomInfoByRoomID", function (roomID) {
    if (Rooms.findOne({_id: roomID}).allSubmitted && Rooms.findOne({_id: roomID}).adminSubmitted) {
		return Rooms.find({_id: roomID}, {fields: {
			roomSize: 1,  
			optionsCount: 1,
			allSubmitted: 1, 
			adminSubmitted: 1,
			readyToVerify: 1,
			isOpen: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.randomBits": 1, 
			"peopleArr.submittedBit": 1, 
			"peopleArr.hashedBits": 1,
			"peopleArr.peerVerifications": 1,
			"peopleArr.hasVerifiedPeers": 1
	    }});
	}
	else {
		return Rooms.find({_id: roomID}, {fields: {
			roomSize: 1,  
			optionsCount: 1,
			allSubmitted: 1, 
			adminSubmitted: 1,
			readyToVerify: 1,
			isOpen: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.hashedBits": 1
	    }});
	}
});

//publish public room info based on adminKey
Meteor.publish("publicRoomInfoByAdminKey", function (adminKey) {
    if (Rooms.findOne({adminKey: adminKey}).allSubmitted && Rooms.findOne({adminKey: adminKey}).adminSubmitted) {
		return Rooms.find({adminKey: adminKey}, {fields: {
			roomSize: 1,  
			optionsCount: 1,
			allSubmitted: 1, 
			adminSubmitted: 1,
			readyToVerify: 1,
			isOpen: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.randomBits": 1, 
			"peopleArr.submittedBit": 1, 
			"peopleArr.hashedBits": 1,
			"peopleArr.peerVerifications": 1,
			"peopleArr.hasVerifiedPeers": 1
	    }});
	}
	else {
		return Rooms.find({adminKey: adminKey}, {fields: {
			roomSize: 1,  
			optionsCount: 1,
			allSubmitted: 1, 
			adminSubmitted: 1,
			readyToVerify: 1,
			isOpen: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.hashedBits": 1
	    }});
	}
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
		
		peerVerified = [];
		var peopleArr = [{
				name: roomAdmin, 
				personID: Meteor.call("stringGen", 10), 
				hasSubmitted: false,
				submittedBit: null, 
				randomBits:  null, 
				hasVerifiedPeers: false,
				peerVerifications: peerVerified,
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
			allSubmitted: false,
			adminSubmitted: false,
			readyToVerify: false,
			isOpen: true,
		})
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
	submitHash:function (roomID, personID, randomBits, submittedBit, hashedBits) {	
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
					newPeopleArr[i].submittedBit = submittedBit;
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
		//gets the new person arry and its lenght
		var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = peopleArr.length;
		//check if all the people have submitted an option
		var allSubmitted = true;
		//searches the array and changes the apropriate person's info
		for (i = 1; i <length; i++) {
			if (peopleArr[i].hasSubmitted){
				allSubmitted = true;
			}
			else {
				allSubmitted = false;
				break;
			}
		}
		//update the room with the relevant info
		Rooms.update(
			{ "_id" : roomID },
			{ $set: { "allSubmitted" : allSubmitted} }
		);
	},
	//checks if the user has submitted their choice
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
	//performs the admin's verification
	userVerify:function (roomID, name, verifyArr) {
	    var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i <length; i++) {
		     peopleArr[i].peerVerifications.push(verifyArr[i]);
	    }
	    
	    for (i = 0; i <length; i++) {
			if (peopleArr[i].name == name){
				peopleArr[i].hasVerifiedPeers = true;
			}
		}		    
	   	
	   	Rooms.update(
			{ "_id" : roomID },
			{ $set: { "peopleArr" : peopleArr} }
		);
		
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
	//gets the number range decided upon room creation
	getOptionsCountByAdminKey:function (adminKey) {
	    return Rooms.findOne({adminKey: adminKey}).optionsCount;
	},
	//performs the admin's verification
	adminVerify:function (adminKey, verifyArr) {
	    var peopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i <length; i++) {
		     peopleArr[i].peerVerifications.push(verifyArr[i]);
	    }
	    
	    peopleArr[0].hasVerifiedPeers = true;
	    
	    Rooms.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : peopleArr} }
		);
	    
	},	
	//submits the admin's hash and closes room
	submitAdminHash:function (adminKey, randomBits, submittedBit, hashedBits) {	
		//gets the person arry and its lenght
		var newPeopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		if (newPeopleArr[0].hasSubmitted == true){
			//do nothing, it is a double submit
		}
		else {
			newPeopleArr[0].randomBits = randomBits;
			newPeopleArr[0].submittedBit = submittedBit;
			newPeopleArr[0].hasSubmitted = true;
			newPeopleArr[0].hashedBits = hashedBits;
		}
		//updates the room
		Rooms.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true, "readyToVerify": true, "isOpen": false} }
		);
		
		
	},	
	//checks if the user has submitted their choice
	hasAdminSubmitted:function (adminKey) {	
		//gets the person arry and its lenght
		var peopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		if (peopleArr[0].hasSubmitted == true){
			return true;
		}
		else {
			return false;
		}
	},	
	
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the joinRoom template, which add a new member to a room with a given ID    //
///////////////////////////////////////////////////////////////////////////////////////////
    
    //adds a new room member to an existing room
	addNewMember:function (roomID, newMemeberName) {
		if (Rooms.findOne({_id: roomID}).isOpen){
			//gets the current array from the collection
			var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
			//generates a new personID for the newmember
			var personID = Meteor.call("stringGen", 6)
			//pushes the new person into the array
			peerVerified = [];
			newPeopleArr.push(
	    		{
					name: newMemeberName, 
					personID: personID, 
					hasSubmitted: false,
				    hasVerifiedPeers: false,
					submittedBit: null, 
					randomBits: null, 
					peerVerifications: peerVerified,
					hashedBits: "Waiting for submission"
				});
			//gets the current room size, and increases it by one
			var newRoomSize = Rooms.findOne({_id: roomID}).roomSize + 1;
			//updates the room
			Rooms.update(
				{ "_id" : roomID },
				{ $set: { "peopleArr" : newPeopleArr, "roomSize": newRoomSize, "allSubmitted": false} }
			);		
			return personID;
		}
	}, 
});
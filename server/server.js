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
			finalSum: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.randomBits": 1, 
			"peopleArr.submittedBit": 1, 
			"peopleArr.hashesGathered": 1,
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
			finalSum: 1,
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
			finalSum: 1,
		    "peopleArr.name": 1,
			"peopleArr.hasSubmitted": 1, 
			"peopleArr.randomBits": 1, 
			"peopleArr.submittedBit": 1, 
			"peopleArr.hashedBits": 1,
			"peopleArr.hashesGathered": 1,
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
			finalSum: 1,
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
		
		//peopleArr with varaibles each user will have
		peerVerified = [];
		var peopleArr = [{
				name: roomAdmin, 
				personID: Meteor.call("stringGen", 10), 
				hasSubmitted: false,
				submittedBit: null, 
				randomBits:  null, 
				hasVerifiedPeers: false,
				hashesGathered: false,
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
			finalSum: "to be determined",
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
	submitHash:function (roomID, personID, hashedBits) {	
		//gets the person arry and its length
		var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = newPeopleArr.length;
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				//protection against double submission
				if (newPeopleArr[i].hasSubmitted == true){
					break;
				}
				//change their submission status to true and submit their hashedbits
				else {
					newPeopleArr[i].hasSubmitted = true;
					newPeopleArr[i].hashedBits = hashedBits;
					break;
				}
			}
		}
		//updates the room with the users hashed bits
		Rooms.update(
			{ "_id" : roomID },
			{ $set: { "peopleArr" : newPeopleArr} }
		);
		//gets the newly updated person array and its length
		var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = peopleArr.length;
		//check if all the people have submitted an option
		var allSubmitted = true;
		//searches the array to see if this person is the last submitter
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
	//submits user's bits
	submitUserBits:function (roomID, randomBits, submittedBit, personID) {	
		//gets the person arry and its lenght
		var newPeopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = newPeopleArr.length;

		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				newPeopleArr[i].randomBits = randomBits;
				newPeopleArr[i].submittedBit = submittedBit;
				newPeopleArr[i].hashesGathered = true;
			}
			//updates the room
			Rooms.update(
				{ "_id" : roomID },
				{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true} }
			);
		}
	},
	//checks if the user has submitted their choice
	hasSubmitted:function (roomID, personID) {	
		//gets the person arry and its lenght
		var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		var length = peopleArr.length;
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (peopleArr[i].personID == personID) {
				//checks if they have submitted
				if (peopleArr[i].hasSubmitted == true){
					return true;
				}
				else {
					return false;
				}
			}
		}
	},
	//performs the user's verification of its peers
	userVerify:function (roomID, name, personID, verifyArr, allHashesValid) {
		//gets the people array from the collection
	    var peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
	    var length = peopleArr.length;
	    //pushes the verifications to each person
	    for (i = 0; i <length; i++) {
		     peopleArr[i].peerVerifications.push(verifyArr[i]);
	    }
	    //if all the hashes passed verification, 
	    //if not the user will never report it has verified it's peers, aborting the process
	    if (allHashesValid){
	    	//changes this user's status to having verified their peers
			for (i = 0; i <length; i++) {
				if (peopleArr[i].personID == personID){
					peopleArr[i].hasVerifiedPeers = true;
				}
			}		    
	   	}
	   	//update the room with the verification or lackthereof
	   	Rooms.update(
			{ "_id" : roomID },
			{ $set: { "peopleArr" : peopleArr} }
		);
		//iterates through the list checking if everyone has peer verified successfully
		var allVerified = true;
		peopleArr = Rooms.findOne({_id: roomID}).peopleArr;
		length = peopleArr.length;
		for (i = 0; i <length; i++) {
			if (peopleArr[i].hasVerifiedPeers == false){
				allVerified = false;
			}
		}
		//if all the peers have verified, calculate the final sum
		if (allVerified) {
			//iterate through the submitted bits
			var finalSum = 0;
			for (i = 0; i <length; i++) {
				finalSum = finalSum + parseInt(peopleArr[i].submittedBit);
				console.log(peopleArr[i].submittedBit);
			}
			console.log(finalSum);
			console.log(Rooms.findOne({_id: roomID}).optionsCount);
			//mod it by the options count
			finalSum = finalSum % Rooms.findOne({_id: roomID}).optionsCount;
			//update the sum
			Rooms.update(
				{ "_id" : roomID },
				{ $set: { "finalSum" : finalSum} }
			);	
		}
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
	adminVerify:function (adminKey, verifyArr, allHashesValid) {
	    var peopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
	    var length = peopleArr.length;
	    //push the admins verifications to the corresponding peers
	    for (i = 0; i <length; i++) {
		     peopleArr[i].peerVerifications.push(verifyArr[i]);
	    }
	    //mark the peers as verified
	    if (allHashesValid) {
	  		peopleArr[0].hasVerifiedPeers = true;
	  	}
	    //update the people arr
	    Rooms.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : peopleArr} }
		);
		
		//get the newly updated people array
		peopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
		length = peopleArr.length;
		var allVerified = true;
		
		//check if everyone has been peer verified 
		//(This will never be the case, as admin peer verifies first)
		for (i = 0; i <length; i++) {
			if (peopleArr[i].hasVerifiedPeers == false){
				allVerified = false;
			}
		}
		//if everyone has peer verified, 
		//calculate the final sum and update the sum
		if (allVerified) {
			var finalSum = 0;
			for (i = 0; i <length; i++) {
				finalSum = finalSum + parseInt(peopleArr[i].submittedBit);
				console.log(peopleArr[i].submittedBit);
			}
			finalSum = finalSum % Rooms.findOne({adminKey: adminKey}).optionsCount;
			Rooms.update(
				{ "adminKey" : adminKey },
				{ $set: { "finalSum" : finalSum} }
			);
			
		}
	    
	},	
	//submits the admin's hash and closes room
	submitAdminHash:function (adminKey, hashedBits) {	
		//gets the person arry and its lenght
		var newPeopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		newPeopleArr[0].hasSubmitted = true;
		newPeopleArr[0].hashedBits = hashedBits;
		//updates the room
		Rooms.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true, "readyToVerify": true, "isOpen": false} }
		);
		
		
	},	
	//submits the admin's hash and closes room
	submitAdminBits:function (adminKey, randomBits, submittedBit) {
		//gets the person arry and its lenght
		var newPeopleArr = Rooms.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		newPeopleArr[0].randomBits = randomBits;
		newPeopleArr[0].submittedBit = submittedBit;
		newPeopleArr[0].hashesGathered = true;
		//updates the room
		Rooms.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true} }
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
					hashesGathered: false,
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
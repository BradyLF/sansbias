import { Meteor } from 'meteor/meteor';

//create a new collection of tables
Tables = new Meteor.Collection('tables');


///////////////////////////////////////////////////////////////////////////////////////////////
//publications of public info, with a passed in tableID or adminKey                           //
///////////////////////////////////////////////////////////////////////////////////////////////

//publish public table info based on tableID
Meteor.publish("Tables", function () {
	return Tables.find();
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
//methods for the addTable template, which creates a new table based on passed in form data//
///////////////////////////////////////////////////////////////////////////////////////////
    
    makeNewRoom:function (tableID, personID, personKey, tableAdmin, hashArr) {
	   var cardKeyArr = [];
	   var nonceArr = [];
	   
	   var peopleArr = [{
		   personID: personID,
		   name: tableAdmin,
		   personKey: personKey,
		   hashArr: hashArr,
		   cardKeyArr: cardKeyArr,
		   nonceArr: nonceArr,
	   }];
	   
	    Tables.insert ({
		    tableID: tableID,
		    peopleArr: peopleArr,
	    });
	},
    
  
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the displayTable template, which retrieves data with an tableID              //
///////////////////////////////////////////////////////////////////////////////////////////
    
	//gets the table admin with the tableID
	getTableAdminByTableID:function (tableID) {
	    return Tables.findOne({_id: tableID}).peopleArr[0].name;
	},
	//gets the person's name with the personID
	getPersonName:function (personID, tableID) {
	    var newPeopleArr = Tables.findOne({_id: tableID}).peopleArr;
		var length = newPeopleArr.length;
		
		//searches the array and changes the apropriate person's info
		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				return newPeopleArr[i].name;
			}
		}
	},
	//gets the number range decided upon table creation
	getOptionsCountByTableID:function (tableID) {
	    return Tables.findOne({_id: tableID}).optionsCount;
	},
	//updates the submitted hash by a user 
	submitHash:function (tableID, personID, hashedBits) {	
		//gets the person arry and its length
		var newPeopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
		//updates the table with the users hashed bits
		Tables.update(
			{ "_id" : tableID },
			{ $set: { "peopleArr" : newPeopleArr} }
		);
		//gets the newly updated person array and its length
		var peopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
		//update the table with the relevant info
		Tables.update(
			{ "_id" : tableID },
			{ $set: { "allSubmitted" : allSubmitted} }
		);
	},
	//submits user's bits
	submitUserBits:function (tableID, randomBits, submittedBit, personID) {	
		//gets the person arry and its lenght
		var newPeopleArr = Tables.findOne({_id: tableID}).peopleArr;
		var length = newPeopleArr.length;

		for (i = 0; i <length; i++) {
			if (newPeopleArr[i].personID == personID) {
				newPeopleArr[i].randomBits = randomBits;
				newPeopleArr[i].submittedBit = submittedBit;
				newPeopleArr[i].hashesGathered = true;
			}
			//updates the table
			Tables.update(
				{ "_id" : tableID },
				{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true} }
			);
		}
	},
	//checks if the user has submitted their choice
	hasSubmitted:function (tableID, personID) {	
		//gets the person arry and its lenght
		var peopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
	userVerify:function (tableID, name, personID, verifyArr, allHashesValid) {
		//gets the people array from the collection
	    var peopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
	   	//update the table with the verification or lackthereof
	   	Tables.update(
			{ "_id" : tableID },
			{ $set: { "peopleArr" : peopleArr} }
		);
		//iterates through the list checking if everyone has peer verified successfully
		var allVerified = true;
		peopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
			}
			//mod it by the options count
			finalSum = finalSum % Tables.findOne({_id: tableID}).optionsCount;
			//update the sum
			Tables.update(
				{ "_id" : tableID },
				{ $set: { "finalSum" : finalSum} }
			);	
		}
	},	



///////////////////////////////////////////////////////////////////////////////////////////
//methods for the manageTable template, which retrieves data with an admin key            //
///////////////////////////////////////////////////////////////////////////////////////////

    //gets an adminKey with an admin key. This code is redudant but it present for consistency's sake
	getTableAdminKey:function (adminKey) {
	    return Tables.findOne({adminKey: adminKey}).adminKey;
	},
	//gets the table admin with an admin key 
	getTableAdminByAdminKey:function (adminKey) {
	    return Tables.findOne({adminKey: adminKey}).peopleArr[0].name;
	},
	//gets the table ID with an admin key
	getTableIDByAdminKey:function (adminKey) {
	    return Tables.findOne({adminKey: adminKey})._id.toString();
	},
	//gets the number range decided upon table creation
	getOptionsCountByAdminKey:function (adminKey) {
	    return Tables.findOne({adminKey: adminKey}).optionsCount;
	},
	//performs the admin's verification
	adminVerify:function (adminKey, verifyArr, allHashesValid) {
	    var peopleArr = Tables.findOne({adminKey: adminKey}).peopleArr;
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
	    Tables.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : peopleArr} }
		);
		
		//get the newly updated people array
		peopleArr = Tables.findOne({adminKey: adminKey}).peopleArr;
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
			}
			finalSum = finalSum % Tables.findOne({adminKey: adminKey}).optionsCount;
			Tables.update(
				{ "adminKey" : adminKey },
				{ $set: { "finalSum" : finalSum} }
			);
		}
	},	
	//submits the admin's hash and closes table
	submitAdminHash:function (adminKey, hashedBits) {	
		//gets the person arry and its lenght
		var newPeopleArr = Tables.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		newPeopleArr[0].hasSubmitted = true;
		newPeopleArr[0].hashedBits = hashedBits;
		//updates the table
		Tables.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true, "readyToVerify": true, "isOpen": false} }
		);
	},	
	//submits the admin's hash and closes table
	submitAdminBits:function (adminKey, randomBits, submittedBit) {
		//gets the person arry and its lenght
		var newPeopleArr = Tables.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		newPeopleArr[0].randomBits = randomBits;
		newPeopleArr[0].submittedBit = submittedBit;
		newPeopleArr[0].hashesGathered = true;
		//updates the table
		Tables.update(
			{ "adminKey" : adminKey },
			{ $set: { "peopleArr" : newPeopleArr, "adminSubmitted": true} }
		);
	},	
	//checks if the user has submitted their choice
	hasAdminSubmitted:function (adminKey) {	
		//gets the person arry and its lenght
		var peopleArr = Tables.findOne({adminKey: adminKey}).peopleArr;
		//protection against double submission
		if (peopleArr[0].hasSubmitted == true){
			return true;
		}
		else {
			return false;
		}
	},	
	
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the joinTable template, which add a new member to a table with a given ID    //
///////////////////////////////////////////////////////////////////////////////////////////
    
    //adds a new table member to an existing table
	addNewMember:function (tableID, newMemeberName) {
		if (Tables.findOne({_id: tableID}).isOpen){
			//gets the current array from the collection
			var newPeopleArr = Tables.findOne({_id: tableID}).peopleArr;
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
					submittedBit: "Not yet public", 
					hashesGathered: false,
					randomBits: null, 
					peerVerifications: peerVerified,
					hashedBits: "Waiting for submission"
				});
			//gets the current table size, and increases it by one
			var newTableSize = Tables.findOne({_id: tableID}).tableSize + 1;
			//updates the table
			Tables.update(
				{ "_id" : tableID },
				{ $set: { "peopleArr" : newPeopleArr, "tableSize": newTableSize, "allSubmitted": false} }
			);		
			return personID;
		}
	}, 
});
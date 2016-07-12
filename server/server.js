import { Meteor } from 'meteor/meteor';

//create a new collection of tables
Tables = new Meteor.Collection('tables');


///////////////////////////////////////////////////////////////////////////////////////////////
//publications of public info, with a passed in tableID or adminKey                           //
///////////////////////////////////////////////////////////////////////////////////////////////

//publish public table info based on tableID
Meteor.publish("getTable", function (tableID) {
	return Tables.find({tableID: tableID});
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
	   var handArr = [];
	   var handValue = 0;
	   
	   var peopleArr = [{
		   personID: personID,
		   name: tableAdmin,
		   personKey: personKey,
		   hashArr: hashArr,
		   cardKeyArr: cardKeyArr,
		   nonceArr: nonceArr,
		   handArr: handArr,
		   handValue: handValue,
		   cardsVerified: 0,
		   cardsRequested: 0,
		   isDealer: true,
	   }];
	   
	    Tables.insert ({
		    tableID: tableID,
		    peopleArr: peopleArr,
			isOpen: true,
			tableSize: 1,
			
	    });
	},
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the displayTable template, which retrieves data with an tableID            //
///////////////////////////////////////////////////////////////////////////////////////////

    isDealer:function (tableID, personID) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personID == personID){
			    if (peopleArr[i].isDealer && peopleArr > 1){
				    return true;
			    }
		    }
	    }
	    return false;
    },
    
    requestDealCards:function (tableID, personID) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personID == personID){
			    if (peopleArr[i].isDealer){
				    for (i = 0; i < length; i++){
					    peopleArr[i].cardsRequested = 3;
				    }
			    }
		    }
	    }
	    
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr, "isOpen" : false} }
		);
    },
    
    submitCards:function (tableID, personID, cardKeyArr, nonceArr) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personID == personID){
			    if (peopleArr[i].cardsRequested == cardKeyArr.length){
				    peopleArr[i].cardKeyArr = cardKeyArr;
				    peopleArr[i].nonceArr = nonceArr;
				    peopleArr[i].cardsRequested = 0;
			    }
		    }
	    }
	    
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr} }
		);
    },
    


///////////////////////////////////////////////////////////////////////////////////////////
//methods for the joinTable template, which add a new member to a table with a given ID    //
///////////////////////////////////////////////////////////////////////////////////////////
    
    //adds a new table member to an existing table
	addNewPlayer:function (tableID, personID, personKey, memberName, hashArr) {
		if (Tables.findOne({tableID: tableID}).isOpen){
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			
			var newTableSize = Tables.findOne({tableID: tableID}).tableSize + 1;
			var cardKeyArr = [];
			var nonceArr = [];
			var handArr = [];
			var handValue = 0;
			
			peopleArr.push({
				personID: personID,
				name: memberName,
				personKey: personKey,
				hashArr: hashArr,
				cardKeyArr: cardKeyArr,
				nonceArr: nonceArr,
				handValue: handValue,
				handArr: handArr,
				isDealer: false,
				cardsRequested: 0,
				cardsVerified: 0,
			})
			
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr, "tableSize" : newTableSize} }
			);
		}
	}, 
});
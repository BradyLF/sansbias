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
	   var dealtCards = [];
	   var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
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
		   verificationsRequested:0,
		   cardsRequested: 0,
		   isDealer: true,
	   }];
	   
	    Tables.insert ({
		    tableID: tableID,
		    dealtCards: dealtCards,
		    peopleArr: peopleArr,
		    deckArr: deckArr,
			isOpen: true,
			tableSize: 1,
			hasDealCards: false,
			
	    });
	},
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the displayTable template, which retrieves data with an tableID            //
///////////////////////////////////////////////////////////////////////////////////////////

    isDealer:function (tableID, personID) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    var hasDealCards = Tables.findOne({tableID: tableID}).hasDealCards
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personID == personID){
			    if (peopleArr[i].isDealer && !hasDealCards){
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
					    peopleArr[i].cardsRequested = peopleArr.length*2 - 1;
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
	    
	    
	    var areDealCards = false;
	    if (cardKeyArr.length == peopleArr.length*2 -1 && nonceArr.length == peopleArr.length*2 -1){
		    areDealCards = true;
	    }
	    
	    
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
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
		
		var lastPersonInt = 0;
	    var allSubmitted = true;
		for (i = 0; i < length; i++){
		    if (peopleArr[i].personID == personID){ 
			    if (peopleArr[i].cardKeyArr.length == peopleArr.length*2 -1) {
				}
				else {
					allSubmitted = false;
				}
			}
		}
		    
		console.log(allSubmitted);
		//console.log("isLastPerson is " + isLastPerson + " and is being called by person " + lastPersonInt);
		if (allSubmitted && areDealCards) {
			var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			var cardsDealt = 0;
			for (i = 0; i < length; i++){
				if (peopleArr[i].isDealer){
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					for (x = 0; x < length; x++){
						console.log(peopleArr[x].cardKeyArr);
						total = total + parseInt(peopleArr[x].cardKeyArr[0].toString());
					}
					peopleArr[i].handArr.push(deckArr[total % deckArr.length])
					dealtCards.push(deckArr[total % deckArr.length]);
					console.log(total % deckArr.length);
					if (isNaN(deckArr[total % deckArr.length])){
						peopleArr[i].handValue = peopleArr[i].handValue + 10;
					}
					else {
						peopleArr[i].handValue = peopleArr[i].handValue + parseInt(deckArr[total % deckArr.length]);
					}
					deckArr.splice(total % deckArr.length, 1);
					Tables.update(
						{ "tableID" : tableID },
						{ $set: { "deckArr" : deckArr, "peopleArr" : peopleArr, "dealtCards" : dealtCards} }
					);
					cardsDealt++;
				}
				else {
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					for (j= 0; j < 2; j++){
						var total = 0;
						for (x = 0; x < length; x++){ 
							total = total + parseInt(peopleArr[x].cardKeyArr[cardsDealt]);
						}
						peopleArr[i].handArr.push(deckArr[total % deckArr.length])
						dealtCards.push(deckArr[total % deckArr.length]);
					console.log(total % deckArr.length);
						if (isNaN(deckArr[total % deckArr.length])){
							peopleArr[i].handValue = peopleArr[i].handValue + 10;
						}
						else {
							peopleArr[i].handValue = peopleArr[i].handValue + parseInt(deckArr[total % deckArr.length]);
						}
						deckArr.splice(total % deckArr.length, 1);
						Tables.update(
							{ "tableID" : tableID },
							{ $set: { "deckArr" : deckArr, "peopleArr" : peopleArr, "dealtCards" : dealtCards} }
						);
						cardsDealt++;
					}
				}
			}
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			
			for (i = 0; i < length; i++){
				peopleArr[i].verificationsRequested = peopleArr.length*2 - 1;
		    }
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "hasDealCards" : true, "peopleArr" : peopleArr} }
			);
		}
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
				verificationsRequested:0,
				cardsVerified: 0,
			})
			
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr, "tableSize" : newTableSize} }
			);
		}
	}, 
});
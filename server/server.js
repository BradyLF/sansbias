import { Meteor } from 'meteor/meteor';

//create a new collection of tables
Tables = new Meteor.Collection('tables');


///////////////////////////////////////////////////////////////////////////////////////////////
//publications of public info, with a passed in tableID or adminKey                           //
///////////////////////////////////////////////////////////////////////////////////////////////

//publish public table info based on tableID
Meteor.publish("getTable", function (tableID) {
	return Tables.find({tableID: tableID}, {fields: {
		    "peopleArr.personKey": 0,
	    }});
});


//meteor methods
Meteor.methods({
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the addTable template, which creates a new table based on passed in form data//
///////////////////////////////////////////////////////////////////////////////////////////
    
    makeNewRoom:function (tableID, personID, personKey, tableAdmin, hashArr) {
	   var cardKeyArr = [];
	   var nonceArr = [];
	   var handArr = [];
	   var dealtCards = [];
	   var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
	   
	   var peopleArr = [{
		   personID: personID,
		   name: tableAdmin,
		   personKey: personKey,
		   hashArr: hashArr,
		   cardKeyArr: cardKeyArr,
		   nonceArr: nonceArr,
		   handArr: handArr,
		   handValue: 0,
		   cardsVerified: 0,
		   verificationsRequested:0,
		   cardsRequested: 0,
		   isDealer: true,
		   isTurn: true,
		   nextRoundRefresh: false,
		   chipCount: 10000,
		   waitingForBet: false,
		   bet: 0,
	   }];
	   
	    Tables.insert ({
		    tableID: tableID,
		    dealtCards: dealtCards,
		    peopleArr: peopleArr,
		    deckArr: deckArr,
			isOpen: true,
			tableSize: 1,
			hasDealCards: false,
			isStaying: false,
			isHitting: false,
			playerToHit: null,
			gameOver: false,
			
	    });
	},
	
	
///////////////////////////////////////////////////////////////////////////////////////////
//methods for the displayTable template, which retrieves data with an tableID            //
///////////////////////////////////////////////////////////////////////////////////////////

	playNextRound:function (tableID, personID, personKey) {
		var gameOver = Tables.findOne({tableID: tableID}).gameOver;
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey && peopleArr[i].isDealer && gameOver){
			   var cardKeyArr = [];
			   var nonceArr = [];
			   var handArr = [];
			   var dealtCards = [];
			   var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
			   
			   var dealer = peopleArr[0];
			   peopleArr.splice(0, 1);
			   peopleArr.push(dealer);
			   
			   for (i = 0; i < length; i++){ 
				   peopleArr[i].cardKeyArr = cardKeyArr;
				   peopleArr[i].nonceArr = nonceArr;
				   peopleArr[i].handArr = handArr;
				   peopleArr[i].handValue = 0;
				   peopleArr[i].cardsVerified = 0;
				   peopleArr[i].isTurn = false;
				   peopleArr[i].isDealer = false;
				   peopleArr[i].nextRoundRefresh = true;
				   peopleArr[i].waitingForBet = true;
			   }
			   
			   peopleArr[0].waitingForBet = false;
			   peopleArr[0].isTurn = true;
			   peopleArr[0].isDealer = true;

			   
			   Tables.update(
			       { "tableID" : tableID },
			       { $set: { 
				       "peopleArr" : peopleArr, 
				       "isOpen" : false, 
				       "hasDealCards": false, 
				       "dealtCards": dealtCards, 
				       "deckArr": deckArr, 
				       "isStaying": false,
					   "isHitting": false,
					   "playerToHit": null,
					   "gameOver": false,
				       } 
				    }
		       );
		    }
	    }
	    
	},
	
	newRoundData: function(tableID, personID, personKey, hashArr) {
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    peopleArr[i].hashArr = hashArr;
			    peopleArr[i].nextRoundRefresh = false;
		    }
		    Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr} }
			);
		}
	},


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
    
    requestDealCards:function (tableID, personID, personKey) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
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
    
    requestHitCards:function (tableID, personID, personKey) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    if (peopleArr[i].isTurn){
				    for (x = 0; x < length; x++){
					    peopleArr[x].cardsRequested = 1;
				    }
				    Tables.update(
						{ "tableID" : tableID },
						{ $set: { "isHitting" : true, "playerToHit" : personID} }
					);
			    }
		    }
	    }
	    
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr} }
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
				    for (x = 0; x < cardKeyArr.length; x++) {
				        peopleArr[i].cardKeyArr.push(cardKeyArr[x]);
				        peopleArr[i].nonceArr.push(nonceArr[x]);
				    }
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
		
	    var isLastPerson;
	    var peopleSubmitted = 0;
		for (i = 0; i < length; i++){
		    if (peopleArr[i].cardsRequested == 0){ 
			    peopleSubmitted++
			}
		}
		
		if (peopleSubmitted == peopleArr.length) {
			isLastPerson = true;
		}
		  
		//if it's the deal  
		if (isLastPerson && areDealCards) {
			console.log("I should only see this once");
			var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			var cardsDealt = 0;
			for (i = 0; i < length; i++){
				if (peopleArr[i].isDealer){
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					for (x = 0; x < length; x++){
						total = total + parseInt(peopleArr[x].cardKeyArr[0].toString());
					}
					peopleArr[i].handArr.push(deckArr[total % deckArr.length])
					dealtCards.push(deckArr[total % deckArr.length]);
					
					if (deckArr[total % deckArr.length] == "A"){
						if (peopleArr[i].handValue == 11 && peopleArr[i].handArr.length == 1) {
							peopleArr[i].handValue = peopleArr[i].handValue + 1;
						}
						else {
							peopleArr[i].handValue = peopleArr[i].handValue + 11;
						}
					}
					else if (isNaN(deckArr[total % deckArr.length])){
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
						if (deckArr[total % deckArr.length] == "A"){
							peopleArr[i].handValue = peopleArr[i].handValue + 11;
						}
						else if (isNaN(deckArr[total % deckArr.length])){
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
		
		var isHitting = Tables.findOne({tableID: tableID}).isHitting;
		
		
		//if it's a hit
		if (isLastPerson && isHitting) {
			var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			
			var playerToHit = Tables.findOne({tableID: tableID}).playerToHit;
			var length = peopleArr.length;
			var cardsDealt = 0;
			
			for (i = 0; i < length; i++){
				if (peopleArr[i].personID == playerToHit){
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					for (x = 0; x < length; x++){
						total = total + parseInt(peopleArr[x].cardKeyArr[peopleArr[x].cardKeyArr.length-1].toString());
					}
					peopleArr[i].handArr.push(deckArr[total % deckArr.length])
					dealtCards.push(deckArr[total % deckArr.length]);
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
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			
			for (i = 0; i < length; i++){
				peopleArr[i].verificationsRequested = 1;
		    }
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr, "playerToHit" : null} }
			);
		}
    },
    
    submitBet:function (tableID, personID, personKey, inputValue) { 
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    peopleArr[i].chipCount = peopleArr[i].chipCount - inputValue;
			    peopleArr[i].bet = inputValue;
			    peopleArr[i].waitingForBet = false;
			    Tables.update(
					{ "tableID" : tableID },
					{ $set: { "peopleArr" : peopleArr} }
				);
		    }
		}
    },
    
    
    checkWinner:function (tableID, personID, personKey) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var length = peopleArr.length;	
		
		var dealerHandValue = 0;
		for (i = 0; i <length; i++) {
			if (peopleArr[i].isDealer) {
				dealerHandValue = peopleArr[i].handValue;
			}
		}
		
		for (i = 0; i < length; i++) {
			if (peopleArr[i].personID == personID) {
				
				if (peopleArr[i].isDealer) {
					var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
					var dealerWinCount = 0;
					for (x = 0; x < length; x++) {
						if (dealerHandValue < 22 && peopleArr[x].handValue > 21) {
							dealerWinCount++
						}
						if (dealerHandValue < 22 && dealerHandValue > peopleArr[x].handValue) {
							dealerWinCount++
						}
					}
					if (dealerWinCount == 1) {
						var response = "You beat " + dealerWinCount + " player";
					}
					else {
						var response = "You beat " + dealerWinCount + " players";
					}
					return response;
						
				}
				
				else {
					var response = "test";
					if (dealerHandValue > 21 && peopleArr[i].handValue > 21) {
						response = "You and the Dealer both busted!";
						peopleArr[i].chipCount = peopleArr[i].chipCount + peopleArr[i].bet	
						peopleArr[i].bet = 0;			
					}
					else if (dealerHandValue > 21 && peopleArr[i].handValue < 22) {
						response = "You win with a score of " + peopleArr[i].handValue;		
						peopleArr[i].chipCount = peopleArr[i].chipCount + (peopleArr[i].bet*2)
						peopleArr[i].bet = 0;			
					}
					else if (dealerHandValue < 22 && peopleArr[i].handValue > 21) {
						response = "Dealer wins with a score of " + dealerHandValue;
						peopleArr[i].bet = 0;			
					}
					else if (dealerHandValue > peopleArr[i].handValue) {
						response = "Dealer wins with a score of " + dealerHandValue;
						peopleArr[i].bet = 0;			
					}
					else {
						response = "You win with a score of " + peopleArr[i].handValue;
						peopleArr[i].chipCount = peopleArr[i].chipCount + (peopleArr[i].bet*2)	
						peopleArr[i].bet = 0;			
		
					}
				Tables.update(
			       { "tableID" : tableID },
				   { $set: { "peopleArr" : peopleArr} }
				);
				return response;
				}
			} 
		}
    },

    
    
    sendVerifications:function (tableID, personID, personKey, verificationCount) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    verificationsRequested = peopleArr[i].verificationsRequested;
			    verificationsRequested = verificationsRequested - verificationCount;
			    
			    peopleArr[i].cardsVerified = peopleArr[i].cardsVerified + verificationCount;
			    peopleArr[i].verificationsRequested = verificationsRequested;
			    Tables.update(
			       { "tableID" : tableID },
				   { $set: { "peopleArr" : peopleArr} }
				);
		    }
	    }
	    
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    
	    var isLastPerson;
	    var peopleSubmitted = 0;
		for (i = 0; i < length; i++){
		    if (peopleArr[i].verificationsRequested == 0){ 
			    peopleSubmitted++
			}
		}
		
		if (peopleSubmitted == peopleArr.length) {
			isLastPerson = true;
		}
	
	
	    var isHitting = Tables.findOne({tableID: tableID}).isHitting;
	
		if (isLastPerson && isHitting == false) {
			for (i = 0; i < length; i++) {
				if (peopleArr[i].isTurn) {
					if (i != length - 1) {
						peopleArr[i].isTurn = false;
						peopleArr[i + 1].isTurn = true;
						Tables.update(
							{"tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
						});
						if (peopleArr[i+1].isDealer) {
							var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
							var length = peopleArr.length;
							var ID = peopleArr[i+1].personID;

							for (i = 0; i < length; i++) {
								for (x = 0; x < length; x++) {
									peopleArr[x].cardsRequested = 1;
                        		}
								Tables.update(
									{"tableID": tableID}, {
									$set: {"isHitting": true, "playerToHit": ID}
                        		});
                    		}	
						}
						Tables.update(
						{ "tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
		                });
						break;
					}
					else {
						peopleArr[i].isTurn = false;
						peopleArr[0].isTurn = true;


						if (peopleArr[0].isDealer) {
							var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
							var length = peopleArr.length;
							var ID = peopleArr[0].personID;

							for (i = 0; i < length; i++) {
								for (x = 0; x < length; x++) {
									peopleArr[x].cardsRequested = 1;
                        		}
								Tables.update(
									{"tableID": tableID}, {
									$set: {"isHitting": true, "playerToHit": ID}
                        		});
                    		}	
						}
						Tables.update(
						{ "tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
		                });
                break;
            }
        }
    }
}    
},
    
    
    changeTurn:function (tableID, personID, personKey) { 
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	
	
	    var isHitting = Tables.findOne({tableID: tableID}).isHitting;
	
	    	for (i = 0; i < length; i++){ 
		    	if (peopleArr[i].isTurn && peopleArr[i].personKey == personKey) {
			    	if (peopleArr[i].isDealer) {
				    	Tables.update(
							{"tableID": tableID}, 
							{$set: {"gameOver": true}
						});
			    	}
					if (i != length - 1) {
						peopleArr[i].isTurn = false;
						peopleArr[i + 1].isTurn = true;
						Tables.update(
							{"tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
						});
						if (peopleArr[i+1].isDealer) {
							var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
							var length = peopleArr.length;
							var ID = peopleArr[i+1].personID;

							for (i = 0; i < length; i++) {
								for (x = 0; x < length; x++) {
									peopleArr[x].cardsRequested = 1;
                        		}
								Tables.update(
									{"tableID": tableID}, {
									$set: {"isHitting": true, "playerToHit": ID}
                        		});
                    		}
						}
						break;
		    		}
					else {
						var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
						var length = peopleArr.length;
					   peopleArr[i].isTurn = false;
					   peopleArr[0].isTurn = true;
					   if (peopleArr[0].isDealer) {
							var ID = peopleArr[0].personID;

							for (i = 0; i < length; i++) {
								for (x = 0; x < length; x++) {
									peopleArr[x].cardsRequested = 1;
                        		}
								Tables.update(
									{"tableID": tableID}, {
									$set: {"isHitting": true, "playerToHit": ID}
                        		});
                    		
                    		}
						}
						Tables.update(
							{"tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
						});
						break; 
		    		}
		    	}
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
				isTurn: false,
				nextRoundRefresh: false,
				chipCount: 10000,
				waitingForBet: true,
				bet: 0,
			})
			
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr, "tableSize" : newTableSize} }
			);
		}
	}, 
});
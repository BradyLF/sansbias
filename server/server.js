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
	    //create needed arrays
	   var cardKeyArr = [];
	   var nonceArr = [];
	   var handArr = [];
	   var dealtCards = [];
	   var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
	   
	   //give a person what they need
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
	   
	   //create table
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

	//method to play the next round
	playNextRound:function (tableID, personID, personKey) {
		var gameOver = Tables.findOne({tableID: tableID}).gameOver;
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    for (i = 0; i < length; i++){
		    //make sure the person is authorized
		    if (peopleArr[i].personKey == personKey && peopleArr[i].isDealer && gameOver){
			   //created needed arrays
			   var cardKeyArr = [];
			   var nonceArr = [];
			   var handArr = [];
			   var dealtCards = [];
			   var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
			   
			   //move the dealer to the end of the table
			   var dealer = peopleArr[0];
			   peopleArr.splice(0, 1);
			   peopleArr.push(dealer);
			   
			   //reset people's data
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
			   
			   //set dealer specific things
			   peopleArr[0].waitingForBet = false;
			   peopleArr[0].isTurn = true;
			   peopleArr[0].isDealer = true;

			   //update the table with the new info
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
	
	//accept new round data from client
	newRoundData: function(tableID, personID, personKey, hashArr) {
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    //set new hash array and remove waiting for data
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

	//check if the client calling this method is the dealer
    isDealer:function (tableID, personID) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    //only let them deal if they haven't already
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
    
    //request the dealing cards from users
    requestDealCards:function (tableID, personID, personKey) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    //iterate through people setting their cards request to the number of cards needed
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    if (peopleArr[i].isDealer){
				    for (i = 0; i < length; i++){
					    peopleArr[i].cardsRequested = peopleArr.length*2 - 1;
				    }
			    }
		    }
	    }
	    
	    //update the table
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr, "isOpen" : false} }
		);
    },
    
    //request cards for hitting a player
    requestHitCards:function (tableID, personID, personKey) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    //request one card from each person and designate the player to hit
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
	    //update the table
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr} }
		);
    },

    //deal with submitted cards
    submitCards:function (tableID, personID, cardKeyArr, nonceArr) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    //check to see if these are the deal cards
	    var areDealCards = false;
	    if (cardKeyArr.length == peopleArr.length*2 -1 && nonceArr.length == peopleArr.length*2 -1){
		    areDealCards = true;
	    }
	    //reset the cards requested
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
	    //update people array
	    Tables.update(
			{ "tableID" : tableID },
			{ $set: { "peopleArr" : peopleArr} }
		);
		
		//get updated people array
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
		//check if this person is the last to submit their cards
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
			var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			var cardsDealt = 0;
			//if it is the deal, move forward with calculations
			for (i = 0; i < length; i++){
				if (peopleArr[i].isDealer){
					//calculate total and mod it by the deck size
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					for (x = 0; x < length; x++){
						total = total + parseInt(peopleArr[x].cardKeyArr[0].toString());
					}
					peopleArr[i].handArr.push(deckArr[total % deckArr.length])
					dealtCards.push(deckArr[total % deckArr.length]);
					//special case for Aces
					if (deckArr[total % deckArr.length] == "A"){
						if (peopleArr[i].handValue == 11 && peopleArr[i].handArr.length == 1) {
							peopleArr[i].handValue = peopleArr[i].handValue + 1;
						}
						else {
							peopleArr[i].handValue = peopleArr[i].handValue + 11;
						}
					}
					//if it is a face card
					else if (isNaN(deckArr[total % deckArr.length])){
						peopleArr[i].handValue = peopleArr[i].handValue + 10;
					}
					//if it is any other card
					else {
						peopleArr[i].handValue = peopleArr[i].handValue + parseInt(deckArr[total % deckArr.length]);
					}
					//remove card from the deck
					deckArr.splice(total % deckArr.length, 1);
					//update info
					Tables.update(
						{ "tableID" : tableID },
						{ $set: { "deckArr" : deckArr, "peopleArr" : peopleArr, "dealtCards" : dealtCards} }
					);
					cardsDealt++;
				}
				//if it is not the deal cards
				else {
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					var total = 0;
					//go through and deal twice
					for (j= 0; j < 2; j++){
						//get the deck index 
						var total = 0;
						for (x = 0; x < length; x++){ 
							total = total + parseInt(peopleArr[x].cardKeyArr[cardsDealt]);
						}
						//push the correspsonding card
						peopleArr[i].handArr.push(deckArr[total % deckArr.length])
						dealtCards.push(deckArr[total % deckArr.length]);
						//edge case for Aces
						if (deckArr[total % deckArr.length] == "A"){
							peopleArr[i].handValue = peopleArr[i].handValue + 11;
						}
						else if (isNaN(deckArr[total % deckArr.length])){
							peopleArr[i].handValue = peopleArr[i].handValue + 10;
						}
						else {
							peopleArr[i].handValue = peopleArr[i].handValue + parseInt(deckArr[total % deckArr.length]);
						}
						//update the deck
						deckArr.splice(total % deckArr.length, 1);
						Tables.update(
							{ "tableID" : tableID },
							{ $set: { "deckArr" : deckArr, "peopleArr" : peopleArr, "dealtCards" : dealtCards} }
						);
						cardsDealt++;
					}
				}
			}
			//update the verifications requested
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
			//get the player to hit
			var playerToHit = Tables.findOne({tableID: tableID}).playerToHit;
			var length = peopleArr.length;
			var cardsDealt = 0;
			for (i = 0; i < length; i++){
				//make sure the person asking for the hit is the player beign hit
				if (peopleArr[i].personID == playerToHit){
					//get the deck
					var deckArr = Tables.findOne({tableID: tableID}).deckArr;
					//calculate the total
					var total = 0;
					for (x = 0; x < length; x++){
						total = total + parseInt(peopleArr[x].cardKeyArr[peopleArr[x].cardKeyArr.length-1].toString());
					}
					//calculate the correct card
					peopleArr[i].handArr.push(deckArr[total % deckArr.length])
					dealtCards.push(deckArr[total % deckArr.length]);
					//if it is a face card
					if (isNaN(deckArr[total % deckArr.length])){
						peopleArr[i].handValue = peopleArr[i].handValue + 10;
					}
					else {
						peopleArr[i].handValue = peopleArr[i].handValue + parseInt(deckArr[total % deckArr.length]);
					}
					//update the deck
					deckArr.splice(total % deckArr.length, 1);
					Tables.update(
						{ "tableID" : tableID },
						{ $set: { "deckArr" : deckArr, "peopleArr" : peopleArr, "dealtCards" : dealtCards} }
					);
					cardsDealt++;
				}
			}
			//get the updated people array
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;
			//request one verification
			for (i = 0; i < length; i++){
				peopleArr[i].verificationsRequested = 1;
		    }
		    //update the people array and reset the player to hit 
			Tables.update(
				{ "tableID" : tableID },
				{ $set: { "peopleArr" : peopleArr, "playerToHit" : null} }
			);
		}
    },
    
    //take a user's submitted bet
    submitBet:function (tableID, personID, personKey, inputValue) { 
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    
	    //set their bet equal to their submitted bet, lower their chip count
	    for (i = 0; i < length; i++){
		    if (peopleArr[i].personKey == personKey){
			    peopleArr[i].chipCount = peopleArr[i].chipCount - inputValue;
			    peopleArr[i].bet = inputValue;
			    peopleArr[i].waitingForBet = false;
			    //update the people array
			    Tables.update(
					{ "tableID" : tableID },
					{ $set: { "peopleArr" : peopleArr} }
				);
		    }
		}
    },
    
    //check for the winner, and adjust chip counts as needed
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
				//if they are the dealer
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
				//if they are not the dealer
				else {
					var response = "";
					//return the chip count
					if (dealerHandValue > 21 && peopleArr[i].handValue > 21) {
						response = "You and the Dealer both busted!";
						peopleArr[i].chipCount = peopleArr[i].chipCount + peopleArr[i].bet	
						peopleArr[i].bet = 0;			
					}
					//double their bet and return it
					else if (dealerHandValue > 21 && peopleArr[i].handValue < 22) {
						response = "You win with a score of " + peopleArr[i].handValue;		
						peopleArr[i].chipCount = peopleArr[i].chipCount + (peopleArr[i].bet*2)
						peopleArr[i].bet = 0;			
					}
					//take the bet
					else if (dealerHandValue < 22 && peopleArr[i].handValue > 21) {
						response = "Dealer wins with a score of " + dealerHandValue;
						peopleArr[i].bet = 0;			
					}
					//take the bet
					else if (dealerHandValue > peopleArr[i].handValue) {
						response = "Dealer wins with a score of " + dealerHandValue;
						peopleArr[i].bet = 0;			
					}
					//double their bet and return it
					else {
						response = "You win with a score of " + peopleArr[i].handValue;
						peopleArr[i].chipCount = peopleArr[i].chipCount + (peopleArr[i].bet*2)	
						peopleArr[i].bet = 0;			
		
					}
				//update the people array
				Tables.update(
			       { "tableID" : tableID },
				   { $set: { "peopleArr" : peopleArr} }
				);
				return response;
				}
			} 
		}
    },

    //deal with sent verifications
    sendVerifications:function (tableID, personID, personKey, verificationCount) {
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    //update the person's requested verifications
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
	    //get updated people array
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	    //check if the person checking this verification is the last one
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
	
		//if it is the last person, rotate the turn
		if (isLastPerson && isHitting == false) {
			for (i = 0; i < length; i++) {
				if (peopleArr[i].isTurn) {
					//if they aren't the last person in the array, send it to the next person
					if (i != length - 1) {
						peopleArr[i].isTurn = false;
						peopleArr[i + 1].isTurn = true;
						Tables.update(
							{"tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
						});
						//if they are the dealer then hit them once to "turn over" their card
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
						//update the people array
						Tables.update(
						{ "tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
		                });
						break;
					}
					//if they are the last person in the array
					else {
						//set the first person in the array to their turn
						peopleArr[i].isTurn = false;
						peopleArr[0].isTurn = true;
						//if they are the dealer then hit them once to "turn over" their card
						if (peopleArr[0].isDealer) {
							var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
							var length = peopleArr.length;
							var ID = peopleArr[0].personID;
							//request a single card
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
						//update the table and break the loop
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
    
    //change turn function, used when a player stays
    changeTurn:function (tableID, personID, personKey) { 
	    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
	    var length = peopleArr.length;
	
	    var isHitting = Tables.findOne({tableID: tableID}).isHitting;
	    	for (i = 0; i < length; i++){ 
		    	//if the person changing turns is the dealer
		    	if (peopleArr[i].isTurn && peopleArr[i].personKey == personKey) {
			    	if (peopleArr[i].isDealer) {
				    	Tables.update(
							{"tableID": tableID}, 
							{$set: {"gameOver": true}
						});
			    	}
			    	//if they are the last person in the array, loop around to the first
					if (i != length - 1) {
						peopleArr[i].isTurn = false;
						peopleArr[i + 1].isTurn = true;
						Tables.update(
							{"tableID": tableID}, 
							{$set: {"peopleArr": peopleArr}
						});
						//if the next person is the dealer, hit them with one card
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
		    		//if not last person, than just move the turn over
					else {
						//get the people array
					    var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
						var length = peopleArr.length;
						//make it the first person's turn
					    peopleArr[i].isTurn = false;
					    peopleArr[0].isTurn = true;
						//if the next person is the dealer, hit them with one card
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
						//update the people arr and break the loop
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
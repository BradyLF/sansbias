import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';

//make the tables collection
Tables = new Meteor.Collection('tables');


///////////////////////////////////////////////////////////////////////////////////////////
//Routes for various templates                                                          //
///////////////////////////////////////////////////////////////////////////////////////////

//route for static index
Router.route('/', function () {
    document.title = 'sansbias | secure group decision making';
	this.render('index');
});
//route for addTable template
Router.route('/addTable', function () {
    document.title = 'Create A Table | sansbias';
    Meteor.subscribe("Tables");
	this.render('addTable');
	
});
//route for join template
Router.route('/joinTable', function () {
	document.title = 'Join A Table | sansbias';
	this.render('joinTable');
});
//route for join with tableID parameter
Router.route('/joinTable/:_id', function () {   
	this.render('joinTable');
});
//route for static about template 
Router.route('/about', function () {
	document.title = 'How It Works | sansbias';
	this.render('about');
});
//route for displayTable template 
Router.route('/table/:tableID/:personID/:personKey', function () {
	var params = this.params;
	var tableID = params.tableID;
	var personID = params.personID;
	document.title = 'View Your Table | sansbias';
    //subscribe to public table info
    Meteor.subscribe("getTable", tableID);
    
	//display deal cards option if they haven't submitted already
	Meteor.call('isDealer', tableID, personID, function (err, showDeal) {
        if (showDeal) {
            Session.set('showDeal',true);
        } else {
	        Session.set('showDeal',false);
        }
	});
	this.render("displayTable");
});




///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the addTable template                                            //
///////////////////////////////////////////////////////////////////////////////////////////

//events for addTable
Template.addTable.events({
	
	//a submission event
	'click .submit': function () {
		//random alphanumeric sting generator
		function stringGen(len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    	}
		
		//get the tableAdmin
		var tableAdmin = $('.table-admin').val();
		
		//sent an alert to the user to get random entropy
		swal({ 
			//contents of alert  
			title: "Please Type Some Random Characters",   
			type: "input",  
			animation: "slide-from-top",   
			showCancelButton: false,   
			closeOnConfirm: false,   }, 
				
			//what to do with the input
			function(inputValue){  
				//check for nulls 
				if (inputValue === false) { return false; }   
				if (inputValue === "") {     
					swal.showInputError("You need to write something!");     
					return false   
				}  
				//if all is ok, create the user's arrays
				else {
					//create arrays
					var cardKeyArr = [];
					var nonceArr = [];
					var hashArr = [];	

					//push each card's info into the array
					for (i = 52; i > 0; i--) {
						
						//get the SHA hash from the input value plus i
						var hash = CryptoJS.SHA256(inputValue + i.toString()).toString();
						var decimalHash = parseInt(hash, 16);
						
						//mod the hash and put it into the array
						var moddedDecimalHash = decimalHash % i;
						cardKeyArr.push(moddedDecimalHash);
						
						//generate the nonce and push it into the array
						var nonce = stringGen(32);
						nonceArr.push(nonce);
						
						//generate the card's hash and push it to the hash array
						hashArr.push(CryptoJS.SHA256(moddedDecimalHash.toString() + nonce.toString()).toString());
					}

					//create tableID, personID, personKey, and deck Array
					var tableID = stringGen(16);
					var personID = stringGen(8);
					var personKey = stringGen(4);
					var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
					
					//locally store all arrays
					localStorage.setItem("cardKeyArr-" + personID, cardKeyArr);
					localStorage.setItem("nonceArr-" + personID, nonceArr);
					localStorage.setItem("hashArr-" + personID, hashArr);
					localStorage.setItem("deckArr-" + personID, deckArr);
					
					//make the new table and redirect to it
					Meteor.call("makeNewRoom", tableID, personID, personKey, tableAdmin, hashArr);
					window.location.href = '/table/' + tableID + "/" + personID + "/" + personKey;
					
			}
		});
	},
});



///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the displayTable template                                        //
///////////////////////////////////////////////////////////////////////////////////////////	
	
//helpers for displaying the table
Template.displayTable.helpers({
	
	//request the user's bet for the round
	getBet: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();	
		
		//get the people array
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var length = peopleArr.length;	
		
		//use peopleArray to get the waiting for bet status and chip count
		var waitingForBet = false;	
		var chipCount = 0;	
		for (i = 0; i <length; i++) {
			if (peopleArr[i].personID == personID) {
				waitingForBet = peopleArr[i].waitingForBet;
				chipCount = peopleArr[i].chipCount;
			}
		}
		
		//if they are waiting for a bet
		if (waitingForBet) {
			swal({   
			title: "How much would you like to bet out of " +  chipCount + " chips?",   
			type: "input", 
			showCancelButton: false,   
			closeOnConfirm: false,   
			animation: "slide-from-top",   
			inputPlaceholder: "chips" }, 
			function(inputValue){  
				//null and non-number protections 
				if (inputValue === false) return false;      
				if (inputValue === "") {     
					swal.showInputError("You need to write something!");     
					return false   
				} 
				if (isNaN(inputValue)){
					swal.showInputError("You need to type a number");     
					return false   
				} 
				if (!isNaN(inputValue) && inputValue > chipCount){
					swal.showInputError("You don't have that many chips!");     
					return false   
				}
				
				if (!isNaN(inputValue) && inputValue < 0){
					swal.showInputError("You cannot bet negative chips");     
					return false   
				}
				//submit the bet and reload if all it good
				else {					
					Meteor.call("submitBet", tableID, personID, personKey, inputValue);	
					location.reload();
			}
		});
		}
	},
	
	//get new data for the next round
	nextRoundRefresh: function () {
		//get parameters from the url
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();	
		
		//get people array and length
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var length = peopleArr.length;	
				
		//use people array to check if new info is being requested
		var refresh = false;	
		for (i = 0; i <length; i++) {
			if (peopleArr[i].personID == personID) {
				refresh = peopleArr[i].nextRoundRefresh;
			}
		}
		
		//if the server is asking for a refresh, ask for needed info
		if (refresh) {
			//random string generator
			function stringGen(len) {
				var text = "";
				var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for( var i=0; i < len; i++ )
					text += charset.charAt(Math.floor(Math.random() * charset.length));
				return text;
    		}
			swal({   
			title: "To Start The Next Round, Input Random Characters",   
			type: "input", 
			showCancelButton: false,   
			closeOnConfirm: false,   
			animation: "slide-from-top",   
			inputPlaceholder: "at least 16 characters" }, 
			function(inputValue){ 
				//null protections  
				if (inputValue === false) return false;      
				if (inputValue === "") {     
					swal.showInputError("You need to write something!");     
					return false   }
				if (inputValue.length < 16) {     
					swal.showInputError("You need to type at least 16 characters");     
					return false   }   
				else {
					//create arrays
					var cardKeyArr = [];
					var nonceArr = [];
					var hashArr = [];	

					//push each card's info into the array
					for (i = 52; i > 0; i--) {
						
						//get the SHA hash from the input value plus i
						var hash = CryptoJS.SHA256(inputValue + i.toString()).toString();
						var decimalHash = parseInt(hash, 16);
						
						//mod the hash and put it into the array
						var moddedDecimalHash = decimalHash % i;
						cardKeyArr.push(moddedDecimalHash);
						
						//generate the nonce and push it into the array
						var nonce = stringGen(32);
						nonceArr.push(nonce);
						
						//generate the card's hash and push it to the hash array
						hashArr.push(CryptoJS.SHA256(moddedDecimalHash.toString() + nonce.toString()).toString());
					}

					var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
					
					//locally store items
					localStorage.setItem("cardKeyArr-" + personID, cardKeyArr);
					localStorage.setItem("nonceArr-" + personID, nonceArr);
					localStorage.setItem("hashArr-" + personID, hashArr);
					localStorage.setItem("deckArr-" + personID, deckArr);
					
					//remove the gathered hashes, as they've changed now
					for (x = 0; x < peopleArr.length; x++) {
						var gatheredHashes = [];	
						localStorage.removeItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID);
					}
					
					//submit the new round data
					Meteor.call("newRoundData", tableID, personID, personKey, hashArr);
					//reload
					location.reload();
			}
		});
		}
	},
	
	//display person's name from method call
	personName: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
				
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var length = peopleArr.length;		
				
		for (i = 0; i <length; i++) {
			if (peopleArr[i].personID == personID) {
				return peopleArr[i].name.toString();
			}
		}
	},
	
	//display dealer's name from method call
	dealerName: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
				
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var length = peopleArr.length;		
				
		for (i = 0; i <length; i++) {
			if (peopleArr[i].isDealer) {
				return peopleArr[i].name.toString();
			}
		}
	},
	
	//display tableCode from method call
	tableCode: function () {
		var params =  Router.current().params;	
		return params.tableID.toString();
	},
	
	//display the winner as well as request chips from method call
	winner: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();
		
		//see if the game is over
		var gameOver = Tables.findOne({tableID: tableID}).gameOver;
		
		//if it is, check for the winner
		if (gameOver) {
			//tell the server to check for the winner and take/give chips
		    Meteor.call("checkWinner", tableID, personID, personKey);
		    
		    //get people array		
			var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
			var length = peopleArr.length;	
		
			//use people arr to get dealer's hand value
			var dealerHandValue = 0;
			for (i = 0; i <length; i++) {
				if (peopleArr[i].isDealer) {
					dealerHandValue = peopleArr[i].handValue;
				}
			}
			for (i = 0; i < length; i++) {
				if (peopleArr[i].personID == personID) {
					//if the client is the dealer, tell them how many people they beat
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
						//grammar!
						if (dealerWinCount == 1) {
							var response = "You beat " + dealerWinCount + " player";
						}
						else {
							var response = "You beat " + dealerWinCount + " players";
						}
						//return winner statement
						return response;		
					}
					//if the person is not the dealer
					else {
						if (dealerHandValue > 21 && peopleArr[i].handValue > 21) {
							var response = "You and the Dealer both busted!";
							return response;
						}
						else if (dealerHandValue > 21 && peopleArr[i].handValue < 22) {
							var response = "You win with a score of " + peopleArr[i].handValue;							
							return response;
						}
						else if (dealerHandValue < 22 && peopleArr[i].handValue > 21) {
							var response = "Dealer wins with a score of " + dealerHandValue;
							return response;
						}
						else if (dealerHandValue > peopleArr[i].handValue) {
							var response = "Dealer wins with a score of " + dealerHandValue;
							return response;
						}
						else {
							var response = "You win with a score of " + peopleArr[i].handValue;
							return response;
						}
					}
				}
			} 
		}		
	},
		
	//display all table data
	tableData: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		//replace some items to make sense to user
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].isDealer){
				if (peopleArr[i].handArr.length == 1) {
					peopleArr[i].handArr.push("?");
				}
				peopleArr[i].isDealer = "Dealer";
			}
			if (peopleArr[i].isDealer == false){
				peopleArr[i].isDealer = "Player";
			}
			if (peopleArr[i].handValue > 21){
				peopleArr[i].handValue = "Bust";
			}
			if (peopleArr[i].cardKeyArr.length == 0){
				peopleArr[i].cardKeyArr.push("Waiting...");
			}
			if (peopleArr[i].handArr.length == 0){
				peopleArr[i].handArr.push("Waiting...");
				peopleArr[i].handArrLength = 0;
			}
			if (peopleArr[i].isTurn){
				peopleArr[i].isTurn = "Waiting...";
			}
			if (!peopleArr[i].isTurn){
				peopleArr[i].isTurn = "";
			}
			else {
				var handArrLength = peopleArr[i].handArr.length;
				peopleArr[i].handArrLength = handArrLength;
			}
			
			if (peopleArr[i].nonceArr.length == 0){
				peopleArr[i].nonceArr.push({nonce: "No Cards Yet"});
			}
			else {
				for (x = 0; x < peopleArr[i].nonceArr.length; x++) {
					peopleArr[i].nonceArr[x] = { nonce: peopleArr[i].nonceArr[x].toString()}
				}
			}
			
			if (peopleArr[i].cardKeyArr.length == 0){
				peopleArr[i].hashArr.push({hash: "No Cards Yet"});
				
			}
			else {
				for (x = 0; x < peopleArr[i].hashArr.length; x++) {
					peopleArr[i].hashArr[x] = { hash: peopleArr[i].hashArr[x].toString()}
	
				}
			}
			
		}
		return peopleArr;
	},
	
	//get table size from method call
	tableSize: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		
		return Tables.findOne({tableID: tableID}).tableSize;
	},
	//show the winner if the game is over
	showWinner: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		
		return Tables.findOne({tableID: tableID}).gameOver;
	},
	//show deal option if there are people in the room
	showDeal: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var hasDealCards = Tables.findOne({tableID: tableID}).hasDealCards;
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		//make sure no one still needs to submit new round data
		var nextRoundRefresh = false 
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].nextRoundRefresh == true) {
				nextRoundRefresh = true;
			}
		}
		//if conditions are met, show the deal option
		if (peopleArr.length > 1 && !hasDealCards && !nextRoundRefresh) {
			return Session.get('showDeal');
		}
		else {
			return false;
		}
	},
	//show the choice to hit if apropriate
	showHitChoice: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var hasDealCards = Tables.findOne({tableID: tableID}).hasDealCards;
		var gameOver = Tables.findOne({tableID: tableID}).gameOver;
		
		//check if it is the person's turn and if they have bust
		var isTurn = false;
		var hasBust = false
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				isTurn = peopleArr[i].isTurn;
				
				if (peopleArr[i].handValue > 21) {
					hasBust = true;
				}
			}
		}
		
		//if all is good, show hit option
		if (hasDealCards && isTurn && !gameOver && !hasBust) {
			return true;
		}
		else {
			return false;
		}
	},
	
	//show the choice to stay if apropriate
	showStayChoice: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		var hasDealCards = Tables.findOne({tableID: tableID}).hasDealCards;
		var gameOver = Tables.findOne({tableID: tableID}).gameOver;
		//check if it the person's turn
		var isTurn = false;
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				isTurn = peopleArr[i].isTurn;
			}
		}
		//if all is good, show the stay choice
		if (hasDealCards && isTurn && !gameOver) {
			return true;
		}
		else {
			return false;
		}
	},
	
	//check to see if the game is over
	gameOver: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		//only show the game is over if they are the dealer too
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				isDealer = peopleArr[i].isDealer;
			}
		}
		
		return Tables.findOne({tableID: tableID}).gameOver && isDealer;		
	},
	
	//show number of nonces
	nonceArrLength: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				return peopleArr[i].nonceArr.length;
			}
		}
	},
	
	//show number of card keys
	cardKeyArrLength: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				return peopleArr[i].cardKeyArr.length;
			}
		}
	},
	
	//show number of hashes
	hashArrLength: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				return peopleArr[i].hashArr.length;
			}
		}
	},
	
	//submit cards to the server
	submitCards: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		//get the cards requested
		var cardKeyArrLength = 0;
		var cardsRequested = 0;
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				if (peopleArr[i].cardsRequested > 0){
					cardsRequested = peopleArr[i].cardsRequested;
					cardKeyArrLength = peopleArr[i].cardKeyArr.length;
				}
			}
		}
		
		//if there are cards requested
		if (cardsRequested > 0){
			//get the hashed is you haven't already
			for (x = 0; x < peopleArr.length; x++) {
				//push the gathered hash into the array
				var gatheredHashes = [];
				for (j = 0; j < peopleArr[x].hashArr.length; j++){
					gatheredHashes.push(peopleArr[x].hashArr[j])
				}
				//if nothing is there already, then locally store it
				if (localStorage.getItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID) == null) {
					localStorage.setItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID, gatheredHashes);
				}
			}
			
			var tableID = params.tableID.toString();
			var personID = params.personID.toString();
			
			//get the card key array
			var cardKeyArrString = localStorage.getItem("cardKeyArr-"+personID);
			var cardKeyArr = cardKeyArrString.split(",");
			
			//get the nonce array
			var nonceArrString = localStorage.getItem("nonceArr-"+personID);
			var nonceArr = nonceArrString.split(",");
					
			//splice the card and nonce arrays to only the cards requested
			cardKeyArr = cardKeyArr.slice(cardKeyArrLength, cardKeyArrLength + cardsRequested);
			nonceArr = nonceArr.slice(cardKeyArrLength, cardKeyArrLength + cardsRequested);
			
			//send the cards to the server
			Meteor.call("submitCards", tableID, personID, cardKeyArr, nonceArr);
		}
	},
	
	//verify cards 
	verifyCards: function () {
		//get parameters
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();	
			
		var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		//get the verifications requested
		var cardKeyArrLength = 0;
		var verificationsRequested = 0;
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].personID == personID){
				if (peopleArr[i].verificationsRequested > 0){
					verificationsRequested = peopleArr[i].verificationsRequested;
					cardKeyArrLength = peopleArr[i].cardKeyArr.length;
				}
			}
		}
		
		//if there are cards requested
		if (verificationsRequested > 0){
			
			var verificationCount = 0;
			var allVerified = true;
			for (i = verificationsRequested; i > 0; i--) {
				//get the deck from local storage
				var deckArrString = localStorage.getItem("deckArr-"+personID);
				var deckArr = deckArrString.split(",");	
				var total = 0;
				
				//add all the card keys submitted by users together
				for (x = 0; x < peopleArr.length; x++) {
					total = total + parseInt(peopleArr[x].cardKeyArr[peopleArr[x].cardKeyArr.length - i]);
				}
				
				//verify that the deck size mod total does result in the card dealt
				if (deckArr[total % deckArr.length] == dealtCards[dealtCards.length - i]) {
					//remove that card from the deck
					deckArr.splice(total % deckArr.length, 1);
					localStorage.setItem("deckArr-"+personID, deckArr);
					console.log("card verified");
					verificationCount++;
				}
				else {
					allVerified = false
				}
			}
			//verify that all the cards submitted were valid from the beginning
			for (x = 0; x < peopleArr.length; x++) {
				for (j= 0; j< peopleArr[x].cardKeyArr.length; j++) {
					//get the gathered hashes from storage
					var gatheredHashesString = localStorage.getItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID);
					var gatheredHashes = gatheredHashesString.split(",");	
					//verify the hash
					var calculatedHash = CryptoJS.SHA256(peopleArr[x].cardKeyArr[j].toString() + peopleArr[x].nonceArr[j].toString()).toString();
					if (gatheredHashes[j] == calculatedHash){
						console.log("hash verified");
					}
					else {
						allVerified = false
					}
				}
			}
			//if everything is verified, send the verification to the server
			if (allVerified) {
				Meteor.call("sendVerifications", tableID, personID, personKey, verificationCount);
			}
		}
	}

});

    
//events for displayTable
Template.displayTable.events({	
	//click the deal cards button
	'click .deal-cards': function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();
		var hasDealCards = Tables.findOne({tableID: tableID}).hasDealCards;
		//tell the server to request the deal cards
		if (!hasDealCards) {
			Meteor.call("requestDealCards", tableID, personID, personKey);
		}
		
	},
	
	//click the hit button
	'click .hit': function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		//tell the server to request the cards for a hit
		Meteor.call("requestHitCards", tableID, personID, personKey);
	},
	
	//click the stay button
	'click .stay': function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();
		//tell the server to change turn
		Meteor.call("changeTurn", tableID, personID, personKey);
		
	},
	
	//a next round event
	'click .next-round': function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		var personKey = params.personKey.toString();
		//tell the server to start the next round
		Meteor.call("playNextRound", tableID, personID, personKey);
		
	},
	
	
}); 
    
///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the joinTable template                                           //
///////////////////////////////////////////////////////////////////////////////////////////

//gets the ID from the parameters
Template.joinTable.helpers({
    getId: function () {
		var params =  Router.current().params;
		return params && params._id ? params._id : '';
	}
});


Template.joinTable.events({
	'click .submit': function () {
		function stringGen(len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    	}
		
		//get the member name
		var memberName = $('.memberName').val();
		
		
		var tableID = $('.joinID').val();
		
		//generate the admin key, create the table, and redirect to new table
		swal({   
			title: "Please Type Some Random Characters!",   
			type: "input", 
			showCancelButton: false,   
			closeOnConfirm: false,   
			animation: "slide-from-top",   
			inputPlaceholder: "at least 16 characters" }, 
			function(inputValue){   
				if (inputValue === false) return false;      
				if (inputValue === "") {     
					swal.showInputError("You need to write something!");     
					return false   }
				if (inputValue.length < 16) {     
					swal.showInputError("You need to type at least 16 characters");     
					return false   }   
				else {
					//create arrays
					var cardKeyArr = [];
					var nonceArr = [];
					var hashArr = [];	

					//push each card's info into the array
					for (i = 52; i > 0; i--) {
						
						//get the SHA hash from the input value plus i
						var hash = CryptoJS.SHA256(inputValue + i.toString()).toString();
						var decimalHash = parseInt(hash, 16);
						
						//mod the hash and put it into the array
						var moddedDecimalHash = decimalHash % i;
						cardKeyArr.push(moddedDecimalHash);
						
						//generate the nonce and push it into the array
						var nonce = stringGen(32);
						nonceArr.push(nonce);
						
						//generate the card's hash and push it to the hash array
						hashArr.push(CryptoJS.SHA256(moddedDecimalHash.toString() + nonce.toString()).toString());
					}
					
					//generate ID's
					var personID = stringGen(8);
					var personKey = stringGen(4);
					var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
					
					//locally store arrays
					localStorage.setItem("cardKeyArr-" + personID, cardKeyArr);
					localStorage.setItem("nonceArr-" + personID, nonceArr);
					localStorage.setItem("hashArr-" + personID, hashArr);
					localStorage.setItem("deckArr-" + personID, deckArr);
					
					//add the new player
					Meteor.call("addNewPlayer", tableID, personID, personKey, memberName, hashArr);
					window.location.href = '/table/' + tableID + "/" + personID + "/" + personKey;
			}
		});
	}
});
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
    
	//display submission option if they haven't submitted already
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
		
		function stringGen(len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    	}
		
		//get the tableAdmin
		var tableAdmin = $('.table-admin').val();
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
					var cardKeyArr = [];
					var nonceArr = [];
					var hashArr = [];
					var hash = CryptoJS.SHA256(inputValue).toString();
					var dexHash = parseInt(hash, 16);
					
					
					for (i = 52; i > 0; i--) {
						var moddedDexHash = dexHash % i;
						cardKeyArr.push(moddedDexHash);
						
						var nonce = stringGen(24);
						nonceArr.push(nonce);
						
						hashArr.push(CryptoJS.SHA256(moddedDexHash.toString() + nonce.toString()).toString());
					}
					
					var tableID = stringGen(14);
					var personID = stringGen(8);
					var personKey = stringGen(4);
					var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
					
					localStorage.setItem("cardKeyArr-" + personID, cardKeyArr);
					localStorage.setItem("nonceArr-" + personID, nonceArr);
					localStorage.setItem("hashArr-" + personID, hashArr);
					localStorage.setItem("deckArr-" + personID, deckArr);
					
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
	
	//display tableCode from method call
	tableCode: function () {
		var params =  Router.current().params;	
		return params.tableID.toString();
	},
	
	//display tableCode from method call
	tableData: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		for (i = 0; i < peopleArr.length; i++){
			if (peopleArr[i].isDealer){
				peopleArr[i].isDealer = "Dealer";
			}
			if (peopleArr[i].isDealer == false){
				peopleArr[i].isDealer = "Player";
			}
			if (peopleArr[i].cardKeyArr.length == 0){
				peopleArr[i].cardKeyArr.push("No Cards Yet");
			}
			if (peopleArr[i].handArr.length == 0){
				peopleArr[i].handArr.push("No Cards Yet");
				peopleArr[i].handArrLength = 0;
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
	
	tableSize: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		
		return Tables.findOne({tableID: tableID}).tableSize;
	},
	
	showDeal: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		
		if (peopleArr.length > 1) {
			return Session.get('showDeal');
		}
		else {
			return false;
		}
	},
	
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
				var gatheredHashes = [];
				
				for (j = 0; j < peopleArr[x].hashArr.length; j++){
					gatheredHashes.push(peopleArr[x].hashArr[j])
				}
				
				if (localStorage.getItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID) == null) {
					localStorage.setItem("gatheredHashes-"+tableID+"-"+peopleArr[x].personID, gatheredHashes);
				}
				console.log("test");
			}
			
			var tableID = params.tableID.toString();
			var personID = params.personID.toString();
			
			var cardKeyArrString = localStorage.getItem("cardKeyArr-"+personID);
			var cardKeyArr = cardKeyArrString.split(",");
			
			var nonceArrString = localStorage.getItem("nonceArr-"+personID);
			var nonceArr = nonceArrString.split(",");
						
			cardKeyArr = cardKeyArr.slice(cardKeyArrLength, cardKeyArrLength + cardsRequested);
			nonceArr = nonceArr.slice(cardKeyArrLength, cardKeyArrLength + cardsRequested);
			
			
			Meteor.call("submitCards", tableID, personID, cardKeyArr, nonceArr);
		}
	},
	
	verifyCards: function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		var dealtCards = Tables.findOne({tableID: tableID}).dealtCards;
		var peopleArr = Tables.findOne({tableID: tableID}).peopleArr;
		//get the cards requested
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
			for (i = verificationsRequested; i > 0; i--) {
				var deckArrString = localStorage.getItem("deckArr-"+personID);
				var deckArr = deckArrString.split(",");	
				console.log(Tables.findOne({tableID: tableID}).deckArr);
				console.log(deckArr);
				var total = 0;
				for (x = 0; x < peopleArr.length; x++) {
					total = total + parseInt(peopleArr[x].cardKeyArr[peopleArr[x].cardKeyArr.length - i]);
				}
				console.log("if " + deckArr[total % deckArr.length] + " == " + dealtCards[dealtCards.length - i])
				console.log(total % deckArr.length);
				if (deckArr[total % deckArr.length] == dealtCards[dealtCards.length - i]) {
					deckArr.splice(total % deckArr.length, 1);
					localStorage.setItem("deckArr-"+personID, deckArr);
					console.log("verified");
				}
				else {
					console.log("not verified");
				}
			}
		verificationsRequested = 0;
		}
	}

});

    
//events for displayTable
Template.displayTable.events({	
	//a submission event
	'click .deal-cards': function () {
		var params =  Router.current().params;	
		var tableID = params.tableID.toString();
		var personID = params.personID.toString();
		
		Meteor.call("requestDealCards", tableID, personID);

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
					var cardKeyArr = [];
					var nonceArr = [];
					var hashArr = [];
					var hash = CryptoJS.SHA256(inputValue).toString();
					var dexHash = parseInt(hash, 16);
					
					
					for (i = 52; i > 0; i--) {
						var moddedDexHash = dexHash % i;
						cardKeyArr.push(moddedDexHash);
						
						var nonce = stringGen(24);
						nonceArr.push(nonce);
						
						hashArr.push(CryptoJS.SHA256(moddedDexHash.toString() + nonce.toString()).toString());
					}
					
					var personID = stringGen(8);
					var personKey = stringGen(4);
					var deckArr = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K","A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"];
					
					localStorage.setItem("cardKeyArr-" + personID, cardKeyArr);
					localStorage.setItem("nonceArr-" + personID, nonceArr);
					localStorage.setItem("hashArr-" + personID, hashArr);
					localStorage.setItem("deckArr-" + personID, deckArr);
					
					Meteor.call("addNewPlayer", tableID, personID, personKey, memberName, hashArr);
					window.location.href = '/table/' + tableID + "/" + personID + "/" + personKey;
			}
		});
	}
});
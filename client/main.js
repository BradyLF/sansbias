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
Router.route('/table/:_id/:personID', function () {
	var params = this.params;
	var tableID = params._id;
	var personID = params.personID;
	document.title = 'View Your Table | sansbias';
    //subscribe to public table info
    Meteor.subscribe("publicTableInfoByTableID", tableID.toString());
	//display submission option if they haven't submitted already
	Meteor.call('hasSubmitted', tableID, personID, function (err, hasSubmitted) {
        if (hasSubmitted) {
            Session.set('showSubmit',false);
        } else {
	        Session.set('showSubmit',true);
        }
	});  
	this.render("displayTable");
});
//route for the admin management template 
Router.route('/manageTable/:adminKey', function () {
	var params = this.params;
	var adminKey = params.adminKey;
	Meteor.subscribe("publicTableInfoByAdminKey", adminKey.toString());
	//display submission option if they haven't submitted already
	document.title = 'Manage Your Table | sansbias';
	Meteor.call('hasAdminSubmitted', adminKey, function (err, hasSubmitted) {
        if (hasSubmitted) {
            Session.set('showSubmit',false);
        } else {
	        Session.set('showSubmit',true);
        }
	});
	this.render("manageTable");
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
			text: "at least 16 characters",  
			showCancelButton: false,   
			closeOnConfirm: false,   
			animation: "slide-from-top",   
			inputPlaceholder: "Write something" }, 
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
			}
		});
	},
});



///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the displayTable template                                        //
///////////////////////////////////////////////////////////////////////////////////////////	
	
//helpers for displaying the table
Template.displayTable.helpers({
	//display tableCode from method call
	tableCode: function () {
		var params =  Router.current().params;			
		Meteor.call("getTableIDByTableID", params._id.toString(), function(error, result){
			Session.set('tableID', result);
    	});
		return Session.get('tableID');
	},
	//display admin name from method call
	adminName: function () {
		var params =  Router.current().params;			
		Meteor.call("getTableAdminByTableID", params._id.toString(), function(error, result){
			Session.set('adminName', result);
    	});
		return Session.get('adminName');
	},
	//display admin name from method call
	personName: function () {
		var params =  Router.current().params;			
		Meteor.call("getPersonName", params.personID.toString() ,params._id.toString(), function(error, result){
			Session.set('personName', result);
    	});
		return Session.get('personName');
	},
	//display tableMembers from method call
	tableData: function () {
		return Tables.findOne().peopleArr;
	},
	//displays the table size from subscribed data
	tableSize: function () {
		return Tables.findOne().tableSize;
	},
	//displays the calculated final Sum
	finalSum: function () {
		return Tables.findOne().finalSum;
	},
	//displays the table size from url parameter
	personID: function () {
		var params =  Router.current().params;			
   		return params.personID.toString();
	},
	//displays the table size from url parameter
	personLink: function () {
   		return window.location.href;
	},
	//displays the options count from method call
	optionsCount: function () {
		var params =  Router.current().params;			
		return ReactiveMethod.call("getOptionsCountByTableID", params._id.toString()) - 1;
	},
	//gathers the hashes from the peopleArr before submitting the bits
	gatherHashes: function () {
		//all the variables!
		var params =  Router.current().params;	
		var tableID = params._id;
		var personID = params.personID;	
		var peopleArr = Tables.findOne({_id: tableID}).peopleArr;
		var length = peopleArr.length;
		var hashesGathered;
		
		//set hashes gathered to it's existing state
		for (i = 0; i < length; i++) {
			if (peopleArr[i].personID == personID){
				hashesGathered = Tables.findOne({_id: tableID}).peopleArr[i].hashesGathered;
			}
		}
		
		//if the table is ready to verify and hashes have yet to be gathered	
		if (Tables.findOne().readyToVerify && !hashesGathered) {
			var peopleArr = Tables.findOne({_id : tableID}).peopleArr;
			var length = peopleArr.length;
			var gatheredHashes = [];
		
			//searches the array and changes the apropriate person's info
			for (i = 0; i < length; i++) {
				gatheredHashes.push(peopleArr[i].hashedBits);
			}
			//locall store the hashes, and retrive the bit and random bits
			localStorage.setItem("gatheredHashes", gatheredHashes);
			var randomBits = localStorage.getItem("randomBits");
			var submittedBit = localStorage.getItem("submittedBit");
			hashesGathered = true;
			//submit the user's bits
			if (hashesGathered){
				Meteor.call("submitUserBits", tableID.toString(), randomBits, submittedBit, personID);
			}
		}
	},
	//check if the admin has submitted, and if so reload to begin verifcation
	hasAdminSubmitted: function() {
		var params =  Router.current().params;	
		var tableID = params._id;
		if (Tables.findOne({_id: tableID}).adminSubmitted && Tables.findOne({_id: tableID}).finalSum == "to be determined") {
			location.reload();
		}
	},
	//verifies hashes submitted by peers
	verifyHashes: function () {
		var params =  Router.current().params;	
		var tableID = params._id;
		var personID = params.personID;	
		var name = Session.get('personName');
		var hasVerified;
		var hashesGathered = false;
		var getPeopleArr = Tables.findOne({}).peopleArr;
		var getLength = getPeopleArr.length;
		var verifyArr = [];
		
		//gets this users status on hashes gathered and verification
		for (i = 0; i < getLength; i++) {
			if (getPeopleArr[i].name == name){
				hasVerified = Tables.findOne({_id: tableID}).peopleArr[i].hasVerifiedPeers;
				hashesGathered = Tables.findOne({_id: tableID}).peopleArr[i].hashesGathered
			}
		}	
		//if table is ready to verify, this user has yet to verify, and this user has the hashes
		if (Tables.findOne().readyToVerify && !hasVerified && hashesGathered) {
			var peopleArr = Tables.findOne({}).peopleArr;
			var length = peopleArr.length;
			var allHashesValid = true;
			//gets hashes from local storage
			var gatheredHashesString = localStorage.getItem("gatheredHashes");
			var gatheredHashes = gatheredHashesString.split(',');
			
			//searches and begins verifying
			for (i = 0; i <length; i++) {
				var submittedBit = peopleArr[i].submittedBit;
				var randomBits = peopleArr[i].randomBits;
				var hashedBits = gatheredHashes[i];
				//hashes the bits
				var clientHash = CryptoJS.SHA256(submittedBit.toString() + randomBits.toString()).toString();
				
				//pushes the subsequent verification to the array index corresponding to the user
				if (clientHash == hashedBits){
					verifyArr.push(name + " has verified");
				}
				else {
					verifyArr.push(name + " is denying verification");
					allHashesValid = false;
				}
			}
			ReactiveMethod.call("userVerify", tableID, name, personID, verifyArr, allHashesValid);
		}
	},
	//displays or doesn't display the submission option
	showSubmit:function(){
        return Session.get('showSubmit')
    },
});
    
//events for displayTable
Template.displayTable.events({	
	//a submission event
	'click .submit': function () {
		//basic isInt function to check the validity of integer
		function isInt(value){ 
			if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
				return true;
			} else { 
				return false;
	  		} 
		}
		//basic string generation function that generates a random alphanumeric string
		function stringGen(len) {
			var text = "";
			var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for( var i=0; i < len; i++ )
				text += charset.charAt(Math.floor(Math.random() * charset.length));
			return text;
    	}	
		//get the submitted but
		var submittedBit = $('.selectedOption').val();
		//get params from url
		var personID = Router.current().params.personID;
		var tableID = Router.current().params._id;
		//if is it not null
		if (submittedBit !== "" || submittedBit !== null) {
			//if it is an integer 
			if (isInt(submittedBit)){
				//if it is within the given range
				if(submittedBit <= parseInt(Tables.findOne().optionsCount - 1) && submittedBit >= 0){
					var randomBits = stringGen(8);
					localStorage.setItem("submittedBit", submittedBit);
					localStorage.setItem("randomBits", randomBits);
					var hashedBits = CryptoJS.SHA256(submittedBit.toString() + randomBits).toString();
					Meteor.call("submitHash", tableID.toString(), personID.toString(), hashedBits);
					location.reload();
				}	
				else {
					alert("You must enter an integer within the given range");
				}		
			}
			else {
				alert("You must enter an integer");
			}
		}
		else {
			alert("You must enter an integer");
		}
	},
}); 
    
///////////////////////////////////////////////////////////////////////////////////////////
//events and helpers for the manageTable template                                         //
///////////////////////////////////////////////////////////////////////////////////////////	
	
Template.manageTable.helpers({  
	//display tableCode
	tableCode: function () {
		var params =  Router.current().params;			
    	return ReactiveMethod.call("getTableIDByAdminKey", params.adminKey.toString());					
	},
	//display adminLink
	adminKey: function () {
		var params =  Router.current().params;
		Meteor.call("getTableAdminKey", params.adminKey.toString(), function(error, result){
			Session.set('adminKey', result);
    	});
    	//return current url and the admin link
    	var adminKey = Session.get('adminKey');
		return adminKey;
	},
	//display tableID
	joinLink: function () {
		var params =  Router.current().params;	
		Meteor.call("getTableIDByAdminKey", params.adminKey.toString(), function(error, result){
			Session.set('tableID', result);
    	});	
		var getTableLink = Session.get('tableID');
		var url = location.origin = location.protocol + "//" + location.host;	
		return url + "/joinTable/" + getTableLink;
	},
	//display admin name
	adminName: function () {
		var params =  Router.current().params;			
    	return ReactiveMethod.call("getTableAdminByAdminKey", params.adminKey.toString());
	},
	//display tableMembers
	tableData: function () {
		return Tables.findOne().peopleArr;
	},
	//gets current table size
	tableSize: function () {
		return Tables.findOne().tableSize;
	},
	//displays the options count from method call
	optionsCount: function () {
		var params =  Router.current().params;			
		return ReactiveMethod.call("getOptionsCountByAdminKey", params.adminKey.toString()) - 1;
	},
	//displays the calculated final Sum
	finalSum: function () {
		return Tables.findOne().finalSum;
	},
	//displays the calculated final Sum
	gatherHashes: function () {
		var params =  Router.current().params;	
		var adminKey = params.adminKey;	
		var tableID = ReactiveMethod.call("getTableIDByAdminKey", params.adminKey.toString());
		var hashesGathered = false
		
		//if it is verifcation time!
		if (Tables.findOne().readyToVerify) {
			var peopleArr = Tables.findOne({_id : tableID}).peopleArr;
			var length = peopleArr.length;
			var gatheredHashes = [];
		
			//searches the array and changes the apropriate person's info
			for (i = 0; i < length; i++) {
				gatheredHashes.push(peopleArr[i].hashedBits);
			}
			//store that stuff locally!
			hashesGathered = true;
			localStorage.setItem("gatheredHashes", gatheredHashes);
			var randomBits = localStorage.getItem("randomBits");
			var submittedBit = localStorage.getItem("submittedBit");

			if (hashesGathered){
				Meteor.call("submitAdminBits", adminKey.toString(), randomBits, submittedBit);
			}
		}
	},
	//verifies hashes submitted by peers
	verifyHashes: function () {
		//all the variables
		var params =  Router.current().params;	
		var adminKey = params.adminKey;		
		var tableID = ReactiveMethod.call("getTableIDByAdminKey", params.adminKey.toString());
		var name = ReactiveMethod.call("getTableAdminByAdminKey", params.adminKey.toString());
		var allHashesValid = true;
		//can just the the 0th because it's the admin
		var hasVerified = Tables.findOne({_id: tableID}).peopleArr[0].hasVerifiedPeers;
		var hashesGathered = Tables.findOne({_id: tableID}).peopleArr[0].hashesGathered;
		
		//makes sure you're ready to verify, you haven't already verified, and you have gathered the hashes
		if (Tables.findOne().readyToVerify && !hasVerified && hashesGathered) {
			var peopleArr = Tables.findOne({_id : tableID}).peopleArr;
			var length = peopleArr.length;
			var verifyArr = [];
			var gatheredHashesString = localStorage.getItem("gatheredHashes");
			var gatheredHashes = gatheredHashesString.split(',');
		
			//searches the array and changes the apropriate person's info
			for (i = 0; i < length; i++) {
				var submittedBit = peopleArr[i].submittedBit;
				var randomBits = peopleArr[i].randomBits;
				var hashedBits = gatheredHashes[i];
				
				var clientHash = CryptoJS.SHA256(submittedBit.toString() + randomBits.toString()).toString();
								
				if (clientHash == hashedBits){
					verifyArr.push(name + " has verified");
				}
				else {
					verifyArr.push(name + " is denying verification");
					allHashesValid = false;
				}
			}
			ReactiveMethod.call("adminVerify", params.adminKey.toString(), verifyArr, allHashesValid)
		}
	},
	//displays or doesn't display the submission option
	showSubmit:function(){
        return Session.get('showSubmit')
    },
});

Template.manageTable.events({
	
	//a submission event
	'click .submit': function () {
		if (Tables.findOne().allSubmitted == true) {
			//basic isInt function to check the validity of integer
			function isInt(value){ 
				if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
					return true;
				} else { 
					return false;
	  			} 
			}
			//basic string generation function that generates a random alphanumeric string
			function stringGen(len) {
				var text = "";
				var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for( var i=0; i < len; i++ )
					text += charset.charAt(Math.floor(Math.random() * charset.length));
				return text;
    		}	
			//get the submitted bit
			var submittedBit = $('.selectedOption').val();
			//get params from url
			var adminKey = Router.current().params.adminKey;
			//if is it not null
			if (submittedBit !== "" || submittedBit !== null) {
				//if it is an integer 
				if (isInt(submittedBit)){
					//if it is within the given range
					if(submittedBit <= parseInt(Tables.findOne().optionsCount - 1) && submittedBit >= 0){
						var randomBits = stringGen(8);
						var hashedBits = CryptoJS.SHA256(submittedBit.toString() + randomBits).toString();
						localStorage.setItem("submittedBit", submittedBit);
						localStorage.setItem("randomBits", randomBits);
						Meteor.call("submitAdminHash", adminKey.toString(), hashedBits);
						location.reload();
						Meteor.subscribe("publicTableInfoByAdminKey", adminKey.toString());
					}	
					else {
						alert("You must enter an integer within the given range");
					}		
				}
				else {
					alert("You must enter an integer");
				}
			}
			else {
				alert("You must enter an integer");
			}
		} else {
			alert("You must wait for everyone in the table to submit their choice first");
		}
	}
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
		//get the tableID
		var getTableID = $('.joinID').val();
			//get the tableID
			var newTableMember = "" + $('.memberName').val();
			Meteor.call("addNewMember", getTableID, newTableMember, function(error, result){
				window.location.href = '/table/' + getTableID + "/" + result;
    		});
	}
});
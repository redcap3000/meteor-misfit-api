// Write your package code here!
Meteor.startup(
	function(){
		MisfitAPI = Npm.require("misfit-cloud-api");
		if(typeof Meteor.settings.misfit != "undefined"){
			var settings = Meteor.settings.misfit;
			if(typeof settings.key != "undefined" && typeof settings.secret != "undefined" && typeof settings.redirect_uri != "undefined"){
				MisfitAPI = new MisfitAPI({
			    	clientKey: settings.key,
				    clientSecret:settings.secret,
			    	redirect_uri: settings.redirect_uri,
				});
			}else{
				console.log("Meteor.settings.misfit misconfigured.");
			}
		}else{
			console.log("Meteor.settings did not have misfit keys.")
		}
	}
);
var getMisfitToken = function(uId){
	var token = Meteor.users.findOne({"services.misfitToken" : {"$exists" : true},_id:uId},{"fields": {"services.misfitToken":1} });	
	if(typeof token != "undefined" && typeof token.services.misfitToken.access_token != "undefined"  ){
		return token.services.misfitToken.access_token;
	}else{
		return undefined;
	}
};
var misfitDateFormat = function(startDate,endDate){
	// iso utc dates to stringformat
		var now = new moment();
		var dFormat = "YYYY-MM-DD";
		if(typeof endDate == "undefined"){
			// get today
			endDate = new moment(now).format(dFormat);
		}else{
			endDate = new moment(startDate).format(dFormat);
		}
		if(typeof startDate == "undefined"){
			// get 7 days past startDate
			startDate = now.subtract(7,'days').format(dFormat);
		}else{
			startDate = new moment(endDate).format(dFormat);
		}
		return {startDate : startDate,endDate : endDate};
};

Meteor.methods({
	misfitRemoveUserData : function(uId){
		if(typeof uId != "undefined"){
			return Misfit.remove({owner:uId});
		}
		return false;
	},
	misfitGetProfile : function(uId){
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token){
			MisfitAPI.getProfile({token: token},Meteor.bindEnvironment(function(e,r){
				if(typeof r != "undefined" && r != null && r){
					Misfit.update({_id : r.userId, owner:uId} , {"$set" : {owner: uId,rType:'profile',birthday:r.birthday,name:r.name} },{upsert:true} );
					return r;
				}
			}));
			return true;
		}
		else{
			console.log("Problem with token with misfit get profile");
		}
		return false;
	},
	misfitGetDevice : function(uId){
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token){
			MisfitAPI.getDevice({token: token},Meteor.bindEnvironment(function(e,r){
				if(typeof r != "undefined" && r != null && r){
					Misfit.update({_id : r.id, owner:uId} , {"$set" : {owner: uId,deviceType:r.deviceType,serialNumber:r.serialNumber,firmwareVersion:r.firmwareVersion,batteryLevel:r.batteryLevel,lastSyncTime:r.lastSyncTime, data : r} },{upsert:true} );
					return r;
				}
			}));
			return true;
		}
		else{
			console.log("Problem with token with misfit get device");
		}
		return false;
	},
	misfitGetGoals : function(uId,startDate,endDate){
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token){
			var dates = misfitDateFormat(startDate,endDate);
			MisfitAPI.getSleep({
			    token: token,
			    start_date:dates.startDate,
			    end_date:dates.endDate
			}, Meteor.bindEnvironment(function(e,r){
				if(typeof r != "undefined" && r != null && r){
					Misfit.update({_id : r.id, owner:uId} , {"$set" : {owner: uId, data : r} },{upsert:true} );
					return r;
				}
			}));
			return true;
		}else{
			console.log("Problem with token with misfit get goals");
		}
		return false;
	},
	misfitGetSummary : function(uId,startDate,endDate){
		// has 30 day limit maybe write stuff in moment to enforce/crawl ranges...
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token){
			var dates = misfitDateFormat(startDate,endDate);
			MisfitAPI.getSummary({
			    token: token,
			    start_date:dates.startDate,
			    end_date:dates.endDate,
			    detail: true
			},Meteor.bindEnvironment(function(e,r){
				if(typeof r != "undefined" && r != null && r){
					Misfit.update({_id : r.id, owner:uId} , {"$set" : {owner: uId, summary : r.summary} },{upsert:true} );
					return r;
				}
			}));
			return true;
		}else{
			console.log("Problem with token with misfit get summary");
		}
		return false;
	},
	misfitGetSession : function(uId,startDate,endDate,objectId){
		// has 30 day limit maybe write stuff in moment to enforce/crawl ranges...
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token){
			var misfit = {
			    token: token,
			    detail:true
			};
			if(typeof objectId != "undefined" && objectId != null && objectId){
				misfit.object_id = objectId
			}else{
				// date processing
				var dates = misfitDateFormat(startDate,endDate);
				misfit.start_date = dates.startDate;
				misfit.end_date = dates.endDate;
			}
			MisfitAPI.getSession(misfit,Meteor.bindEnvironment(function(e,r){
				if(typeof r != "undefined" && r != null && r){
					Misfit.update({_id : r.id, owner:uId} , {"$set" : {owner: uId, data : r} },{upsert:true} );
					return r;
				}
			}));
			return true;
		}else{
			console.log("Problem with token with misfit get session");
		}
	},
	misfitSleepData : function(uId,startDate,endDate,objectId){
		// lookup user token... eventually move into users object
		// probably just date a js date object as stored in mongo and convert to momemnt
		var token = getMisfitToken(uId);
		if(typeof token != "undefined" && token != null && token ){
			var misfit = {
				  token: token,
				  detail:true
			};

			if(typeof objectId != "undefined" && objectId != null && objectId){
				misfit.object_id = objectId;
			}else{
				var dates = misfitDateFormat(startDate,endDate);
				misfit.start_date = dates.startDate;
				misfit.end_date = dates.endDate;
			}
			// if start and end date not provided get a week from the currant date
			MisfitAPI.getSleep(misfit,
				Meteor.bindEnvironment(function(err,result){
				    if (err || !result) {
				        return callback(err);
				    }
				    if(typeof result.sleeps != "undefined" && result.sleeps.length > 0){
				    	//Misfit.update({_id : result.id, owner:uId}, {} )
				    	// possibly convert startTime to date object...
				    	// do date time conversion
				    	var r = [];
				    	var rStart,rDuration;
				    	result.sleeps.filter(function(arr){
				    		rStart = arr.startTime;
				    		rDuration = arr.duration;
				    		arr.sleepDetails.filter(function(theTime){
				    			var x = { datetime : new moment.utc(theTime.datetime).toDate(), value: theTime.value };
					    		if(x){
					    			r.push(x);
					    		}
				    		});
				    	});
				    	Misfit.update({_id :rStart+uId, owner:uId} , {"$set" : { rId :result.id, owner: uId,duration:rDuration, sleeps : r} },{upsert:true} );
				    }
				}
				)
			);
		}else{
			console.log("Problem with Token check");
			return false;
		}
	},
	misfitAuth : function(){
		if(typeof MisfitAPI != "undefined"){
			var redirect;
			var q= MisfitAPI.authorize(function(err,redirectURL){
				// change location...
				redirect = redirectURL;
				return redirectURL;
			});
			return redirect;
			//return redirect;
		}else{
			console.log("MisfitAPI Not found");
		}
		return false;
	},
	misfitExchange : function(code,uId){
		if(typeof code != "undefined" &&  typeof uId != "undefined" && uId != null ){
			// FIX THIS...
			MisfitAPI.exchange(code,Meteor.bindEnvironment(function(err,token){
				if(typeof err != "undefined" &&  err != null && typeof err.code != "null"){
					console.log(err.code);
				}
				if(typeof token != "undefined" && token){
					// update user object...
					Meteor.users.update({_id : uId} , {"$set" : {"services.misfitToken" : token} } );
				}else{
					// auth expired probably... re route to misfit to regenerate or ask user
					console.log("Problem with misfit exchange");
				}
			}));

		}else{
			if(typeof this.userId == "undefined"){
				console.log("User not logged in");
			}
			console.log("MisfitAPI Not found in exchange step.");
		}
		return false;
	}
});
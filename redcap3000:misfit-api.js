// Write your package code here!
Meteor.startup(
	function(){
		MisfitAPI = Npm.require("misfit-cloud-api");
		if(typeof Meteor.settings.misfit != "undefined"){
			var settings = Meteor.settings.misfit;
			if(typeof settings.key != "undefined" && typeof settings.secret != "undefined" && typeof settings.redirect_uri != "undefined"){
				MisfitAPI = new MisfitAPI({
			    	clientKey: settings.key,//clientKey in our developer portal
				    clientSecret:settings.secret,//clientSecret in our developer portal
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

Meteor.methods({
	misfitSleepData : function(uId,startDate,endDate){
		// lookup user token... eventually move into users object
		// probably just date a js date object as stored in mongo and convert to momemnt
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
		
		var token = Meteor.users.findOne({"services.misfitToken" : {"$exists" : true},_id:uId},{"fields": {"services.misfitToken":1} });

		if(typeof token != "undefined" && typeof token.services.misfitToken.access_token != "undefined"  ){
			// if start and end date not provided get a week from the currant date
			MisfitAPI.getSleep({
			    token: token.services.misfitToken.access_token,
			    start_date:startDate,
			    end_date:endDate,
			    detail:true
			},
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
			    	console.log(Misfit.update({_id : result.id, owner:uId} , {"$set" : {owner: uId,startTime: rStart,duration:rDuration, data : r} },{upsert:true} ));

			    }
			}));

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
					// store this value?
					//if(!Misfit.findOne({_id : code})){
					//	console.log(Misfit.insert({_id : code, error : err.code  ,owner:uId}));
					//}
					//else
					//	console.log('error record already created');
					console.log(err.code);
				}
				if(typeof token != "undefined" && token){
					// update user object...
					//Meteor.Users.findOne({_id : uId});
					console.log('should be updating Meteor.users ');
					console.log(Meteor.users.update({_id : uId} , {"$set" : {"services.misfitToken" : token} } ));

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

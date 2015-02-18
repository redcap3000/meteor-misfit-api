// Write your package code here!
Meteor.startup(function(){
	MisfitAPI = Npm.require("misfit-cloud-api");

	MisfitAPI = new MisfitAPI({
    	clientKey:'P1OLJq6HATNgyWID',//clientKey in our developer portal
	    clientSecret:'wrwSNdczc7iPtxDay7RaI5wkQ5otJBRp',//clientSecret in our developer portal
    	redirect_uri: 'http://varsahealth.varsahealth.com:3000/misfit',
	});
});

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
		
		var token = Misfit.findOne({token : {"$exists" : true},owner:uId},{"fields": {token:1} });

		if(typeof token != "undefined" && typeof token.token.access_token != "undefined"){
			console.log('making sleep call to \t: ' + token.token.access_token + '\t startDate: ' + startDate + ' \t endDate: ' + endDate );
			// if start and end date not provided get a week from the currant date
			MisfitAPI.getSleep({
			    token: token.token.access_token,
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
			    	result.sleeps.filter(function(arr){
			    		console.log('result sleeps : ');
			    		console.log(arr);
			    		arr.sleepDetails.filter(function(theTime){
			    			var x = { datetime : new moment.utc(theTime.datetime).toDate(), value: theTime.value };
				    		console.log(x);
				    		if(x){
				    			r.push(x);
				    		}

			    		});
			    	});
			    	console.log(Misfit.update({_id : result.id, owner:uId} , {"$set" : {owner: uId,startTime: result.startTime,duration:result.duration, data : r} },{upsert:true} ));

			    }
			    // iterate through sleepDetails to determine if a value is different or existing?
			    // probably use update/upsert if possible
				/*
				  {
				    "sleeps":[
				      {
				        "id":"54dab076c5ab5e8196243025",
				        "autoDetected": false,
				        "startTime":"2014-05-19T23:26:54+07:00",
				        "duration": 0,
				        "sleepDetails":[
				          {
				            "datetime":"2014-05-19T23:26:54+07:00",
				            "value":2
				          },
				          {
				            "datetime":"2014-05-19T23:59:22+07:00",
				            "value":1
				          },
				          ...
				        ]
				      },
				      ...
				    ]
				  }
				 */
			}));

		}else{
			console.log("Problem with Token check");
			return false;
		}
	},
	misfitAuth : function(){
		if(typeof MisfitAPI != "undefined"){
			console.log(this.userId);
			console.log(MisfitAPI);
			var redirect;
			var q= MisfitAPI.authorize(function(err,redirectURL){
				console.log(err);
				// change location...
				redirect = redirectURL;
				console.log(redirectURL);
				return redirectURL;
			});
			console.log(redirect);
			return redirect;
			//return redirect;
		}else{
			console.log("MisfitAPI Not found");
		}
		return false;
	},
	misfitExchange : function(code,uId){
		console.log(code);
		console.log(uId);
		if(typeof code != "undefined" &&  typeof uId != "undefined" && uId != null ){
			console.log('upserting _id : ' + code  + ' owner : ' + uId);
			// FIX THIS...
		

			MisfitAPI.exchange(code,Meteor.bindEnvironment(function(err,token){
				console.log(err);
				if(typeof err != "undefined" &&  err != null && typeof err.code != "null"){
					// store this value?
//					var check = Misfit.findOne()
					//console.log(err);
					if(!Misfit.findOne({_id : code}))
						console.log(Misfit.insert({_id : code, error : err.code  ,owner:uId}));
					else
						console.log('error record already created');
				}
				if(typeof token != "undefined" && token){
				
					console.log(Misfit.update({_id : code, owner:uId} , {"$set" : {token : token} },{upsert:true} ));

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



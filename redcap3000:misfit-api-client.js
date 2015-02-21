var getProfile = function () {
	var profileCheck = Misfit.findOne({"data.name" : {"$exists": true} });
	console.log(profileCheck);
	if(!profileCheck){
		if(Meteor.userId()){
			Meteor.call("misfitGetProfile",Meteor.userId());
			return true;
		}
	}else{
		return profileCheck;
	}
	return false;
		// ...
	};
var getDevice = function(){
	var deviceCheck = Misfit.findOne({"data.deviceType" : {"$exists": true} });
	if(!deviceCheck){
		if(Meteor.userId()){
			Meteor.call("misfitGetDevice",Meteor.userId());
			return true;
		}
	}else{
		return deviceCheck;
	}
	return false;
};
var getSleepData = function(){
	var sleepCheck = Misfit.findOne({"data.deviceType" : {"$exists": false} ,"data.summary" : {"$exists": false} , "data.name" : {"$exists" : false }  });
	console.log(sleepCheck);
	if(!sleepCheck){
		if(Meteor.userId()){
			Meteor.call("misfitSleepData",Meteor.userId());
			return true;
		}
	}else{
		return sleepCheck;
	}
	return false;
};

var getSummary = function(){
	var summaryCheck = Misfit.findOne({"data.summary" : {"$exists": true} });
	if(!summaryCheck){
		if(Meteor.userId()){
			Meteor.call("misfitGetSummary",Meteor.userId());
			return true;
		}
	}else{
		return summaryCheck;
	}
	return false;
};

Template.misfit.helpers({
	getProfile: function () {
		return getProfile();
	},
	getDevice:function(){
		return getDevice();
	},
	getSleepData:function(){
		return getSleepData();
	},
	getSummary:function(){
		return getSummary();
	}
});
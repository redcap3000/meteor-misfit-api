Misfit = new Meteor.Collection("misfit_api");
Misfit.allow({
	
	remove: function (userId, doc) {
		if(doc.owner == userId){
			return true;
		}
	}
});
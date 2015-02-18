# meteor-misfit
## Meteor wrapper for [Misfit-Cloud-Api-Wrapper](https://github.com/Chandler-Sun/misfit-cloud-api-wrapper) 



### Quickstart
Uses a 'Misfit' variable (client/server collection) to store data either index by the owner or id (or code for authentication process).

1. Use misfitAuth to generate URL

2. Use code from redirect from above and Meteor.userId() for misfitExchange(code,userId)

3. Issue method calls(misfitGetGoals,misfitGetSummary, misfitGetSleep etc.) to various methods referencing (at least) a Meteor.userId() and start/end dates, or object ids where available

4. Subscribe to Misfit collection filtering by owner:Meteor.userId()

### Notes
Response data is stored in a 'data' field in Misfit collection. 

Misfit key is stored in Users.services.misfit and is not passed to the client ever.

Re-running auth/exchange will replace the key in the user object.

### Issues
I had to run sudo meteor in macosx (10.10.1) to get the Misfit-cloud-api-wrapper npm module to load properly.
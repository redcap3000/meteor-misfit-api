Npm.depends({"misfit-cloud-api":"0.0.3"});

Package.describe({
  name: 'redcap3000:misfit-api',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Wrapper for misfit-cloud-api',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/redcap3000/meteor-misfit-api',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use(['momentjs:moment','accounts-base','templating'], ['client','server']);
  api.addFiles('redcap3000:misfit-model.js',['client','server']);
  api.addFiles('redcap3000:misfit-api.js','server');
  api.addFiles(['redcap3000:misfit-api.html','redcap3000:misfit-api-client.js'],'client');
  api.export("MisfitAPI",'server');
  api.export("Misfit",['server','client']);
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('redcap3000:misfit-api');
  api.addFiles('redcap3000:misfit-api-tests.js');
});

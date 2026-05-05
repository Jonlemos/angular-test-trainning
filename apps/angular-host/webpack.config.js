const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {},
  
  shared: {
    "@angular/core": { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    "@angular/common": { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    "@angular/router": { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    "rxjs": { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    "react": { 
      singleton: true, 
      strictVersion: false, 
      requiredVersion: false,
    },
    "react-dom": { 
      singleton: true, 
      strictVersion: false, 
      requiredVersion: false,
    },
  },
});
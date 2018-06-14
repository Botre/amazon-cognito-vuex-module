# Amazon Cognito Vuex Module

> Vuex module for Amazon Cognito

Easily link your Vuex application to an Amazon Cognito User Pool.

## Notes

* This is essentialy a wrapper of the [Amazon Cognito Identity SDK for JavaScript](https://github.com/aws/aws-amplify/tree/master/packages/amazon-cognito-identity-js)
* Federated Identities are not supported (pull request welcome).
* Email is used instead of username.
* API naming parallels AWS SDK naming.
* Module size: +-275KB, optimization pull requests are welcome.
* All actions are wrapped in Promises.

## Links

* Vuex: https://vuex.vuejs.org/en/
* Cognito: https://aws.amazon.com/cognito/

## Installation

```bash
npm install amazon-cognito-vuex-module --save
```

```javascript
import Vue from 'vue';
import Vuex from 'vuex';
import App from './App.vue';
import AmazonCognitoVuexModule from 'amazon-cognito-vuex-module';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    cognito: new AmazonCognitoVuexModule({
      region: '<region>',
      userPoolId: '<user pool id>',
      clientId: '<client id>'
    })
  }
});

new Vue({
  el: '#app',
  render: h => h(App),
  store
});
```

## Axios interceptor example

```javascript
// Add authentication token to each request
axios.interceptors.request.use(async config => {
  const response = await store.dispatch('getUserSession');
  if (response && response.accessToken && response.accessToken.jwtToken) {
    config.headers.AccessToken = response.accessToken.jwtToken;
  }
  return config;
});
```

## API

### State

**Whether user authentication is currently in progress**

`$store.state.cognito.authenticating`

**The authenticated user (null if none)**

`$store.state.cognito.authenticated`

### Actions

**Check whether a user is currently authenticated, if so: update state**

`$store.dispatch('checkAuthentication')`

**Authenticate user and establish session**

`$store.dispatch('authenticateUser', {email: 'hello@world.com', password: 'foobar'})`

**Fetch user session**

`$store.dispatch('getUserSession')`

**Fetch attributes of the authenticated user**

`$store.dispatch('getUserAttributes')`

**Change password of the currently authenticated user (given the current and new passwords)**

`$store.dispatch('changePassword', {currentPassword: 'Hello', newPassword: 'World!'})`

**Initiate lost password procedure (send verification code to user)**

`$store.dispatch('forgotPassword', {email: 'hello@world.com'})`

**Confirm a new password for a given email, verification code and new password**

`$store.dispatch('confirmPassword', {email: 'hello@world.com', verificationCode: 1337, newPassword: 'dontforgetme'})`

**Sign up a new user for a given email and password and attribute list (optional) (then sends registration verification code)**

`$store.dispatch('signUp', {email: 'hello@world.com', password: 'dontforgetme', attributeList: { country: 'BE' }})`

**Confirm a registration for a given email and registration verification code**

`$store.dispatch('confirmRegistration', {email: 'hello@world.com', verificationCode: 1337})`

**Re-send the registration verification code**

`$store.dispatch('resendConfirmationCode', {email: 'hello@world.com'})`

**Sign out user**

`$store.dispatch('signOut')`

**Refresh token**

`$store.dispatch('refreshToken')`

## Twitter

[Follow me on Twitter](https://twitter.com/KrolsBjorn)

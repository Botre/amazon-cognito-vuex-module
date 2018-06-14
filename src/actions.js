import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

export default {
  /* Check whether a user is currently authenticated, if so: update state */
  checkAuthentication({ commit, state }) {
    return new Promise((resolve, reject) => {
      commit('setAuthenticating', true);
      const user = state.pool.getCurrentUser();
      if (user == null) {
        commit('setAuthenticating', false);
        commit('setAuthenticated', null);
        resolve(false);
      } else {
        user.getSession((error, session) => {
          commit('setAuthenticating', false);
          if (error) {
            commit('setAuthenticated', null);
            reject('Session error');
          } else {
            commit('setAuthenticated', user);
            resolve(session);
          }
        });
      }
    });
  },
  /* Authenticate user and establish session */
  authenticateUser({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      commit('setAuthenticating', true);
      const email = payload.email;
      const password = payload.password;
      const user = new CognitoUser({
        Username: email,
        Pool: state.pool
      });
      user.authenticateUser(
        new AuthenticationDetails({
          Username: email,
          Password: password
        }),
        {
          onFailure: function(error) {
            commit('setAuthenticating', false);
            reject(error);
          },
          onSuccess: function(session) {
            commit('setAuthenticating', false);
            commit('setAuthenticated', user);
            resolve(session);
          },
          newPasswordRequired: function(userAttributes, requiredAttributes) {
            commit('setAuthenticating', false);
            delete userAttributes.email_verified; // Immutable field
            user.completeNewPasswordChallenge(
              payload.newPassword,
              userAttributes,
              this
            );
          }
        }
      );
    });
  },
  /* Get user session */
  getUserSession({ state }) {
    return new Promise((resolve, reject) => {
      const user = state.pool.getCurrentUser();
      if (user != null) {
        user.getSession(function(error, session) {
          if (error) {
            reject(error);
          } else {
            resolve(session);
          }
        });
      } else {
        resolve();
      }
    });
  },
  /* Fetch attributes of the authenticated user */
  getUserAttributes({ commit, state }) {
    return new Promise((resolve, reject) => {
      const user = state.pool.getCurrentUser();
      if (user == null) {
        resolve();
      } else {
        user.getSession((error, session) => {
          if (error) {
            reject(error);
          } else {
            user.getUserAttributes((error, result) => {
              if (error) {
                reject(error);
              } else {
                const attributes = {};
                result.forEach(attribute => {
                  attributes[attribute.getName()] = attribute.getValue();
                });
                commit('setAttributes', attributes);
                resolve('Attributes fetched');
              }
            });
          }
        });
      }
    });
  },
  /* Change password of the currently authenticated user (given the current and new passwords) */
  changePassword({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      const currentPassword = payload.currentPassword;
      const newPassword = payload.newPassword;
      const user = state.pool.getCurrentUser();
      if (user == null) {
        reject('Unauthenticated');
      } else {
        user.getSession((error, session) => {
          if (error) {
            reject(error);
          } else {
            user.changePassword(
              currentPassword,
              newPassword,
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
          }
        });
      }
    });
  },
  /* Initiate lost password procedure (send verification code to user) */
  forgotPassword({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      const email = payload.email;
      const user = new CognitoUser({
        Username: email,
        Pool: state.pool
      });
      user.forgotPassword({
        onSuccess: result => {
          resolve(result);
        },
        onFailure: function(error) {
          reject(error);
        }
      });
    });
  },
  /* Confirm a new password for a given email, verification code and new password */
  confirmPassword({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      const email = payload.email;
      const verificationCode = payload.verificationCode;
      const newPassword = payload.newPassword;
      const user = new CognitoUser({
        Username: email,
        Pool: state.pool
      });
      user.confirmPassword(verificationCode, newPassword, {
        onSuccess: result => {
          resolve(result);
        },
        onFailure: function(error) {
          reject(error);
        }
      });
    });
  },
  /* Sign up a new user for a given email and password (then sends registration verification code) */
  signUp({ commit, state }, payload) {
    const email = payload.email;
    const password = payload.password;
    return new Promise((resolve, reject) => {
      const attributes = [];
      if (payload.attributesList) {
        Object.entries(payload.attributesList).forEach(entry => {
          attributes.push(
            new CognitoUserAttribute({
              Name: entry[0],
              Value: entry[1]
            })
          );
        });
      }
      attributes.push(
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      );
      state.pool.signUp(email, password, attributes, null, (error, result) => {
        if (error) {
          reject(error);
        } else {
          const user = result.user;
          resolve(user);
        }
      });
    });
  },
  /* Confirm a registration for a given email and registration verification code */
  confirmRegistration({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      const email = payload.email;
      const verificationCode = payload.verificationCode;
      const user = new CognitoUser({
        Username: email,
        Pool: state.pool
      });
      user.confirmRegistration(verificationCode, true, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  },
  /* Re-send the registration verification code */
  resendConfirmationCode({ commit, state }, payload) {
    return new Promise((resolve, reject) => {
      const email = payload.email;
      const user = new CognitoUser({
        Username: email,
        Pool: state.pool
      });
      user.resendConfirmationCode((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  },
  /* Sign out user */
  signOut({ commit, state }) {
    const user = state.pool.getCurrentUser();
    if (user != null) {
      user.signOut();
      commit('setAuthenticated', null);
    }
  },
  /* Refresh token */
  refreshToken({ commit, state }) {
    return new Promise((resolve, reject) => {
      const user = state.pool.getCurrentUser();
      if (user != null) {
        user.getSession(function(error, session) {
          if (error) {
            reject(error);
          } else {
            const refreshToken = session.getRefreshToken();
            user.refreshSession(refreshToken, (err, session) => {
              if (err) {
                reject(err);
              } else {
                try {
                  commit('setAuthenticated', user);
                  resolve(session);
                } catch (e) {
                  reject(e);
                }
              }
            });
          }
        });
      } else {
        resolve();
      }
    });
  }
};

import { userConstants } from '../constants';
import { UserService } from '../services';
import { alertActions } from './';
import { history } from '../helpers';

export const userActions = {
    login,
    logout,
    register,
    delete: _delete
};

function login(group, username, password) {
    return dispatch => {
        dispatch(request({ username }));

        UserService.login(group, username, password)
            .then(
                user => {
                    dispatch(success(user));
                    history.push('/');
                },
                error => {
                    dispatch(failure(error));
                    dispatch(alertActions.error(error));
                }
            );
    };

    function request(user) { return { type: userConstants.LOGIN_REQUEST, user } }
    function success(user) { return { type: userConstants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: userConstants.LOGIN_FAILURE, error } }
}

function logout() {
    UserService.logout();
    return { type: userConstants.LOGOUT };
}

function register(user) {
    return dispatch => {
        dispatch(request(user));

        UserService.register(user)
            .then(
                user => {
                    dispatch(success());
                    history.push('/login');
                    dispatch(alertActions.success('Registration successful'));
                },
                error => {
                    console.log(error);
                    dispatch(failure(error));
                    dispatch(alertActions.error(error));
                }
            );
    };

    function request(user) { return { type: userConstants.REGISTER_REQUEST, user } }
    function success(user) { return { type: userConstants.REGISTER_SUCCESS, user } }
    function failure(error) { return { type: userConstants.REGISTER_FAILURE, error } }
}


// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(username) {
    return dispatch => {
        dispatch(request(username));

        UserService.delete(username)
            .then(
                user => {
                    dispatch(success(username));
                },
                error => {
                    dispatch(failure(username, error));
                }
            );
    };

    function request(username) { return { type: userConstants.DELETE_REQUEST, username } }
    function success(username) { return { type: userConstants.DELETE_SUCCESS, username } }
    function failure(username, error) { return { type: userConstants.DELETE_FAILURE, username, error } }
}
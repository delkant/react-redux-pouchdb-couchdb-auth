import PouchDB from 'pouchdb'
import PouchAuth from 'pouchdb-authentication'

PouchDB.plugin(PouchAuth)
var remote_dbs = [];
var local_dbs = [];

export class UserService {

    static login = (group, username, password) => {
        return UserService.remoteDBs(group)
            .then(db => db.logIn(username, password)
                .then(response => {
                    localStorage.setItem('group', group)
                    localStorage.setItem('user', JSON.stringify(response))
                    UserService.sycnLocally(group, db)
                    return UserService.handleResponse(response)
                })
            ).catch(error => {
                return UserService.handleResponse(error)
            });
    }

    static logout = () => {
        const group = localStorage.getItem('group')

        if (group) {
            UserService.remoteDBs(group).then(db => db.logOut())
        }
        // remove user from local storage to log user out
        localStorage.removeItem('group')
        localStorage.removeItem('user')
    }

    static getUser = (username) => {
        const group = localStorage.getItem('group');
        UserService.remoteDBs(group)
            .then(db => db.getUser(username, (err, response) => {
                if (err) {
                    if (err.name === 'not_found') {
                        return UserService.handleResponse({ statusText: `User ${username} not found!` })
                    } else {
                        return UserService.handleResponse({ statusText: `Error retrieving ${username} !` })
                    }
                } else {
                    return UserService.handleResponse({ ok: true, ...response })
                }
            })
            );
    }

    static register = (user) => {
        //More info: https://github.com/pouchdb-community/pouchdb-authentication/blob/master/docs/api.md#dbsignupusername-password--options--callback
        return UserService.remoteDBs(user.group)
            .then(db => db.signUp(user.username, user.password,
                {
                    metadata: {
                        email: user.email,
                        group: user.group,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    }

                }).then(response => { return UserService.handleResponse(response) })
            ).catch(error => {
                return UserService.handleResponse(error);
            });
    }

    static update = (user) => {
        return UserService.remoteDBs(user.group)
            .then(db => db.putUser(user.username,
                {
                    metadata: {
                        email: user.email,
                        group: user.group,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    }

                }).then(response => { return UserService.handleResponse({ ok: true, ...response }) })
            ).catch(error => {
                return UserService.handleResponse(error);
            });
    }

    static delete = (username) => {
        const group = localStorage.getItem('group')

        return UserService.remoteDBs(group)
            .then(db => db.deleteUser(username)
                .then(response => { return UserService.handleResponse({ ok: true, ...response }) })
            ).catch(error => {
                return UserService.handleResponse(error)
            });
    }

    static handleResponse = (response) => {
        if (!response.ok) {
            const msg = response.message ? response.message : (response.statusText ? response.statusText : JSON.stringify(response))
            return Promise.reject(msg)
        }

        return response;
    }

    static remoteDBs = (group) => {
        return remote_dbs[group] ? Promise.resolve(remote_dbs[group]) : UserService.createDB(group)
    }

    static createDB = (name) => {
        remote_dbs[name] = new PouchDB(`http://localhost:5984/${name}`, { skipSetup: true })
        return remote_dbs[name].info()
            .then(success => { return remote_dbs[name] })
            .catch(error => {
                return UserService.handleResponse({ statusText: "Invalid Group" })
            });
    }

    static sycnLocally = (name, db) => {
        var local = new PouchDB(name)
        local.sync(db, { live: true, retry: true }).on('error', console.log.bind(console))
        local_dbs[name] = local
    }

    static getLocalDB = (name) => {
        return local_dbs[name] ? Promise.resolve(local_dbs[name]) : UserService.createDB(name)
    }
}
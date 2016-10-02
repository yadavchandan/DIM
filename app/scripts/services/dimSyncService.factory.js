(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('SyncService', SyncService);

  SyncService.$inject = ['$q'];

  function toOpenLoadout(cached) {
    var ret = {};
    if (!cached['loadouts-v4.0']) {
      return ret;
    }
    for (var membershipId in cached['loadouts-v4.0']) {
      var loadouts = _.map(cached['loadouts-v4.0'][membershipId], function(id) {
        return cached[id];
      });

      ret[membershipId] = [];
      loadouts.forEach(function(loadout) {
        ret[membershipId].push({
          guid: loadout.id,
          name: loadout.name,
          platform: loadout.platform,
          subclass: loadout.classType,
          equip: _.map(_.filter(loadout.items, function(item) {
            return item.amount === 1 && item.equipped;
          }), function(item) {
            return {
              id: item.id
            };
          }),
          inventory: _.map(_.filter(loadout.items, function(item) {
            return item.amount === 1 && !item.equipped;
          }), function(item) {
            return {
              id: item.id
            };
          }),
          stackable: _.map(_.filter(loadout.items, function(item) {
            return item.amount > 1;
          }), function(item) {
            return {
              hash: item.hash,
              amount: item.amount
            };
          }),
        });
      });
    }
    return ret;
  }

  function toOpenTag(cached) {
    return {
      xb1: cached['dimItemInfo-1'],
      ps4: cached['dimItemInfo-2'],
    };
  }

  function toDIMLoadout(loadouts) {
    var ret = {
      'loadouts-v4.0': {}
    };
    for (var membershipId in loadouts) {
      loadouts[membershipId].forEach(function(loadout) {
        var items = [];
        loadout.equip.forEach(function(item) {
          items.push({
            id: item.id,
            amount: 1,
            equipped: true
          });
        });
        loadout.inventory.forEach(function(item) {
          items.push({
            id: item.id,
            amount: 1,
            equipped: false
          });
        });
        loadout.stackable.forEach(function(item) {
          items.push({
            hash: item.hash,
            amount: item.amount,
            equipped: false
          });
        });

        ret[loadout.guid] = {
          id: loadout.guid,
          name: loadout.name,
          platform: loadout.platform,
          classType: loadout.subclass,
          version: 'v4.0',
          items: items
        };
        ret['loadouts-v4.0'][membershipId].push(loadout.guid);
      });
    }
    return ret;
  }

  function SyncService($q) {
    var cached; // cached is the data in memory,
    var drive = { // drive api data
      client_id: '$GAPI_VERSION.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.appfolder',
      immediate: false
    };
    var ready = $q.defer();

    function init() {
      ready.resolve();
    }

    function revokeDrive() {
      console.warn('error managing drive data. revoking drive.');
      if (cached && cached.loadoutFileId) {
        remove('loadoutFileId');
      }
      if (cached && cached.tagFileId) {
        remove('tagFileId');
      }
    }

    // promise to find the file id from google drive
    function getFileId(fileName) {
      // create a file in the appDataFolder
      function createFile(fileName, callback) {
        gapi.client.drive.files.create({
          fields: 'id',
          resource: {
            name: fileName,
            parents: ['appDataFolder']
          }
        }).execute(function(resp) {
          if (!resp || !resp.id) {
            console.log(resp);
            return;
          }
          callback(resp.id);
        });
      }

      // list all the files in the appDataFolder, grab the fileId + return.
      function getOrCreateId(fileName, callback) {
        gapi.client.drive.files.list({
          q: 'name="' + fileName + '"',
          spaces: 'appDataFolder',
          fields: 'files(id)'
        }).execute(function(resp) {
          if (!resp || !resp.files) {
            console.warn('Error connecting to Open Loadouts', resp);
            return;
          }
          // if there isn't one, make one.
          if (!resp.files.length) {
            createFile(fileName, callback);
            return;
          }
          callback(resp.files[0].id);
        });
      }

      // load google
      var ret = $q.defer();
      gapi.client.load('drive', 'v3', function() {
        // grab or create file id
        getOrCreateId(fileName, function(id) {
          console.log('got ', id, fileName);
          ret.resolve(id);
        });
      });
      return ret.promise;
    }

    // check if the user is authorized with google drive
    function authorize() {
      var authed = $q.defer();

      // we're a chrome app so we do this
      if (chrome.identity) {
        chrome.identity.getAuthToken({
          interactive: false
        }, function(token) {
          if (chrome.runtime.lastError) {
            revokeDrive();
            return;
          }
          gapi.auth.setToken({
            access_token: token
          });

          $q.all([getFileId("Open.Loadout"), getFileId("Open.Tags")]).then(function(resp) {
            set({
              loadoutFileId: resp[0],
              tagFileId: resp[1]
            });
            authed.resolve();
          });
        });
      } else {
        // otherwise we do the normal auth flow
        gapi.auth.authorize(drive, function(result) {
          if (!result || result.error) {
            revokeDrive();
            return;
          }
          drive.immediate = result && !result.error;

          $q.all([getFileId("Open.Loadout"), getFileId("Open.Tags")]).then(function(resp) {
            set({
              loadoutFileId: resp[0],
              tagFileId: resp[1]
            });
            authed.resolve();
          });
        });
      }
      return authed.promise;
    }

    function getDriveFile(id) {
      var d = $q.defer();

      gapi.client.drive.files.get({
        fileId: id,
        alt: 'media'
      }).execute(function(resp) {
        if (resp.code === 401 || resp.code === 404) {
          revokeDrive();
          return;
        }
        d.resolve(resp);
      });

      return d.promise;
    }

    function saveDriveFile(id, content) {
      // save to google drive
      if (!id) {
        return;
      }
      gapi.client.request({
        path: '/upload/drive/v3/files/' + id,
        method: 'PATCH',
        params: {
          uploadType: 'media',
          alt: 'json'
        },
        body: content
      }).execute(function(resp) {
        if (resp && resp.error && (resp.error.code === 401 || resp.error.code === 404)) {
          console.log('error saving. revoking drive.', resp);
          revokeDrive();
          return;
        }
      });
    }

    // save data {key: value}
    function set(value, PUT) {
      if (!cached) {
        return;
      }
      //----
      // TODO:
      // if value === cached, we don't need to save....
      // this is a very naive check.
      //----
      //      if(JSON.stringify(value) === JSON.stringify(cached)) {
      //        console.log('nothing changed.');
      //        return;
      //      }

      // use replace to override the data. normally we're doing a PATCH
      if (PUT) { // update our data
        cached = value;
      } else if (cached) {
        angular.extend(cached, value);
      } else {
        cached = value;
      }

      // save to local storage
      localStorage.setItem('DIM', JSON.stringify(cached));

      // save to chrome sync
      if (chrome.storage && chrome.storage.sync) {
        var toSync = cached;

        // don't chrome.sync tags if we're connected to drive (to save chrome sync space)
        if (cached.tagFileId) {
          toSync = _.omit(cached, ['dimItemInfo-1', 'dimItemInfo-2']);
        }

        console.log('saving', cached);

        chrome.storage.sync.set(toSync, function() {
          if (chrome.runtime.lastError) {
            //            console.log('error with chrome sync.')
          }
        });
      }

      if (dimFeatureFlags.driveSyncEnabled) {
        saveDriveFile(cached.loadoutFileId, toOpenLoadout(cached));
        saveDriveFile(cached.tagFileId, toOpenTag(cached));
      }
    }

    // get DIM saved data
    function get(force) {
      // if we already have it and we're not forcing a sync
      if (cached && !force) {
        return $q.resolve(cached);
      }

      var deferred = $q.defer();

      // grab from localStorage first
      cached = JSON.parse(localStorage.getItem('DIM'));

      // if we have drive sync enabled, get from google drive
      // eventually we could use this for DIM to drive...
//      if (fileId || (cached && cached.fileId)) {
//        fileId = fileId || cached.fileId;
//
//        ready.promise.then(authorize).then(function() {
//          gapi.client.load('drive', 'v3', function() {
//            gapi.client.drive.files.get({
//              fileId: fileId,
//              alt: 'media'
//            }).execute(function(resp) {
//              if (resp.code === 401 || resp.code === 404) {
//                revokeDrive();
//                return;
//              }
//              console.log('well hello', resp);
//
//              cached = resp;
//              deferred.resolve(cached);
//              return;
//            });
//          });
//        });
//      } // else get from chrome sync
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(null, function(data) {
          cached = data;

          if (dimFeatureFlags.driveSyncEnabled) {
            ready.promise.then(authorize).then(function() {
              $q.all([getDriveFile(cached.loadoutFileId), getDriveFile(cached.tagFileId)]).then(function(resp) {
                angular.extend(cached, toDIMLoadout(resp[0].result));
                cached['dimItemInfo-' + cached.platformType] = resp[1].result;

                deferred.resolve(cached);
              });
            });
          } else {
            deferred.resolve(cached);
          }
        });
      } // otherwise, just use local storage
      else {
        deferred.resolve(cached);
      }

      return deferred.promise;
    }

    // remove something from DIM by key
    function remove(key) {
      // just delete that key, maybe someday save to an undo array?
      delete cached[key];

      // sync to data storage
      set(cached, true);
    }

    return {
      authorize: authorize,
      get: get,
      set: set,
      remove: remove,
      init: init,
      drive: function() {
        return cached && cached.loadoutFileId === undefined;
      }
    };
  }
})(angular);

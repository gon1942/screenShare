const {app, dialog, globalShortcut} = require('electron')
const {ipcMain} = require('electron')
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const mkDirpAsync = promisify(mkdirp);
const osType = require('os');
const dir  = osType.homedir() + '/.config/askos-support'
const fileDir  = osType.homedir() + '/.config/askos-support/userinfo_config';
const uniqid = require('uniqid');
const fs = require('fs');
const request = require('request');

//##################################################################

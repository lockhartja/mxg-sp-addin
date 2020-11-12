/* eslint-disable */
 let LogLevel = require('sp-rest-proxy/dist/utils/logger');
const fs = require('fs');

// tslint:disable-next-line: no-var-requires
var RestProxy = require('sp-rest-proxy');

const settings = {
    configPath: './.config/private.json',
    port: 4298,
    logLevel: LogLevel.Verbose,
};

var restProxy = new RestProxy(settings);
restProxy.serve();

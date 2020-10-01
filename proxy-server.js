var LogLevel = require('sp-rest-proxy/dist/utils/logger');
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

// const regex = /((\d+[-\s\w]+)|(?:\s(AFLOA|AFOSI|AFNWC|Minot|Mepcom|Mafb)))(?=\/)|(\d+\s\w+)$|((NON-MAIL ENABLED))/gim;

// /^(\d{10}).+(?<=USA|AFGSC)[^\d]+((\d+\s([\w]{2,5}|[-\w\s]+))|AFLOA|AFOSI|AFNWC|Minot|Mepcom|Mafb)(?=\/)/;
//const regex = /^(\d{10}).+(?<=US(?:S|A|F)|AFGSC|NG)([^\d]+(((\d+\s(\w{2,5}|[-\w\s]+))|AFLOA|AFOSI|AFNWC|Minot|MEPCOM|MAFB|AFAA)(?=\/)|(?<=\/)(\d+\s\w{2,5}))|\s(\d+\s(\w{2,5})))/gim;

// while ((m = regex.exec(str)) !== null) {
//     // This is necessary to avoid infinite loops  with zero-width matches
//     if (m.index === regex.lastIndex) {
//         regex.lastIndex++;
//     }

//     am.push(`${m[1]}-${m[3]}`);
//     console.log(`${m[3]}-${m[3]}`);
// }
// console.log(am.length);

// fs.writeFile('Output.txt', am.join(','), (err) => {
//     // In case of a error throw err.
//     if (err) throw err;
// });

// _spPageContextInfo.webServerRelativeUrl + '/_api/web/currentuser/?$expand=groups

// fetch(
//     _spPageContextInfo.webServerRelativeUrl + '/_api/web/currentuser/?$expand=groups',
//     {
//         headers: {
//             accept: 'application/json',
//         },
//     },
// )
//     .then(function (response) {
//         console.log('got response');
//         return response.json();
//     })
//     .then(function (jdata) {
//         console.log('got json');
//         console.log(jdata);
//     })
//     .catch(function (error) {
//         console.log(error);
//     });

// fetch(
//     'https://usaf.dps.mil/teams/5MXG-WM/striker-app/_api/SP.UserProfiles.PeopleManager/GetMyProperties',
//     {
//         headers: {
//             accept: 'application/json',
//         },
//     },
// )
//     .then(function (response) {
//         console.log('got response');
//         return response.json();
//     })
//     .then(function (jdata) {
//         console.log('got json');
//         console.log(jdata);
//     })
//     .catch(function (error) {
//         console.log(error);
//     });

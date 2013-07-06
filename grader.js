#!/usr/bin/env node
/*
    Automatically grade files for the presence of specified HTML tags and
    attributes. Uses commander.js and cheerio. Teaches command line
    application development and basic DOM parsing.
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {

    var instr = infile.toString();
    if (!fs.existsSync(instr)) {

        console.log('%s does not exist. Exiting.', instr);
        process.exit(1);
    }
    return instr;
};

var htmlDataFromFile = function(htmlfile, callback) {
    var wrappedCallback = function(err, data) {
        callback(data);
    }
    return fs.readFile(htmlfile, wrappedCallback);
};

var htmlDataFromUrl = function(url, callback) {
    rest.get(url).on('complete', callback);
};

var acquireHtml = function(file, url, callback) {

    if (url == undefined && file == undefined) {
        file = assertFileExists(HTMLFILE_DEFAULT);
    }

    if (url != undefined) {
        htmlDataFromUrl(url, callback);
    } else {
        htmlDataFromFile(file, callback);
    }
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlData, checksfile) {

    $ = cheerio.load(htmlData);

    var checks = loadChecks(checksfile).sort();
    var out = {};

    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};


if (require.main == module) {

    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <url>', 'HTTP URL to the html file to check')
        .parse(process.argv);

    acquireHtml(program.file, program.url, function(htmlData) {

        var checkJson = checkHtmlFile(htmlData, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);

        console.log(outJson);
    });

} else {

    exports.checkHtmlFile = checkHtmlFile;
}


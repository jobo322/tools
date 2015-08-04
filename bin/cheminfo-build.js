#!/usr/bin/env node

'use strict';

var program = require('commander');
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

program
    .option('-w, --cwd [dirname]', 'Working directory', process.cwd())
    .option('-o, --out [dirname]', 'Output directory', 'dist')
    .option('-r, --root [rootname]', 'Root name of the library')
    .option('-u, --no-uglify', 'Disable generation of min file with source map');

program.parse(process.argv);

var cwd = path.resolve(program.cwd);
var pkg = tryPackage(cwd);
var entryPoint = pkg.main || 'index.js';
if (!fs.existsSync(path.join(cwd, entryPoint))) {
    throw new Error('No entry point found in ' + cwd);
}

var name = program.root || pkg.name;
if (!name) {
    throw new Error('No name found');
}

var filename = pkg.name || 'bundle';

var webpackConfig = {
    context: cwd,
    entry: entryPoint,
    output: {
        path: path.join(cwd, program.out),
        filename: filename + '.js',
        library: name,
        libraryTarget: 'umd'
    },
    plugins: []
};

webpack(webpackConfig, function (err) {
    if (err) {
        throw err;
    } else {
        console.log('Build of ' + filename + ' successful');
        if (program.uglify) {
            doMinify();
        }
    }
});

function doMinify() {
    webpackConfig.devtool = 'source-map';
    webpackConfig.output.filename = filename + '.min.js';
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
        minify: true
    }));
    webpack(webpackConfig, function (err) {
        if (err) {
            throw err;
        } else {
            console.log('Build of ' + filename + ' (min) successful');
        }
    });
}

function tryPackage(cwd) {
    var pkg = path.join(cwd, 'package.json');
    try {
        return JSON.parse(fs.readFileSync(pkg, 'utf8'));
    } catch (e) {
        return {};
    }
}

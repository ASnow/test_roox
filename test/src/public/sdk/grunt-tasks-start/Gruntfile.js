'use strict';

module.exports = function (grunt) {
    var TASK_FOLDER = 'node_modules/rx-grunt-tasks',
        _ = grunt.util._.extend,
        // utiltity function -
        loadConfig = function (path) {
            var object = {};
            var key;
            grunt.file.expand(path + '/*.js').forEach(function(filePath) {
                var option = filePath.split('/').pop();
                key = option.replace(/\.js$/,'');
                object[key] = require('./' + filePath);
            });
            return object;
        };
    // Load all grunt tasks
    require('load-grunt-tasks')(grunt, {config: TASK_FOLDER+'/package'});
    // Show elapsed time at the end
    require('time-grunt')(grunt);
    // load tasks from folder
    if ( grunt.file.isDir(TASK_FOLDER + '/tasks') ) {
        grunt.loadTasks(TASK_FOLDER + '/tasks');
    }

    // Project configuration. Extend predefined
    grunt.initConfig(_(loadConfig(TASK_FOLDER + '/tasks/options'), {
        // Metadata.
        pkg: grunt.file.readJSON('package.json')
    }));
};

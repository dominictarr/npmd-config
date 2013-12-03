#! /usr/bin/env node

var path     = require('path')
var rc       = require('rc')
var optimist = require('optimist')
var toCC     = require('to-camel-case')
var osenv    = require('osenv')

var home     = osenv.home()
var tmp      = osenv.tmpdir()

var config = module.exports = (function () {
  // *** vvv Copied this stuff out of npmconf **********************
  var uidOrPid = process.getuid ? process.getuid() : process.pid

  if (home) process.env.HOME = home
  else home = path.resolve(tmp, "npm-" + uidOrPid)

  var cacheExtra = process.platform === "win32" ? "npm-cache" : ".npm"
  var cacheRoot = process.platform === "win32" && process.env.APPDATA || home
  var cache = path.resolve(cacheRoot, cacheExtra)
  // *** ^^^ Copied this stuff out of npmconf **********************

  var config = rc('npmd', {
    dbPath: path.join(home, '.npmd'),
    debug: false,
    sync: false,
    encoding: 'json',
    registry: 'http://isaacs.iriscouch.com/registry',
    cache: cache,
    "user-agent" : "node/" + process.version
                 + ' ' + process.platform
                 + ' ' + process.arch,
    prefix: (
      process.env.PREFIX ||
      ( process.platform === 'win32' ? path.dirname(process.execPath)
      : path.dirname(path.dirname(process.execPath)))
    ),
    port: 5656
  },
  clearFalse(optimist
    .alias('g', 'global')
    .alias('f', 'force')
    .alias('D', 'saveDev')
    .alias('S', 'save')
    .alias('v', 'version')
    .boolean('global')
    .boolean('online')
    .boolean('offline')
    .boolean('save-dev')
    .boolean('saveDev')
    .boolean('save-peer')
    .boolean('savePeer')
    .boolean('save')
    .argv)
  )

  //undefined is falsey anyway,
  //allow config from other sources to fall through
  function clearFalse (opts) {
    for(var k in opts)
      if(opts[k] === false)
        delete opts[k]
    return opts
  }

  config.bin = config.bin ||
  ( config.global ? path.join(config.prefix, 'bin')
  : path.join(config.path || process.cwd(), 'node_modules', '.bin'))

  if(!config.path && config.global)
    config.path = path.join(config.prefix, 'lib')

  for(var k in config)
    config[toCC(k)] = config[k]

  if(config.showConfig)
    console.log(JSON.stringify(config, null, 2))

  return config
})()


if(!module.parent)
  console.log(JSON.stringify(config, null, 2))

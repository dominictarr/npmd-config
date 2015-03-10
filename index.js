#! /usr/bin/env node

var path     = require('path')
var rc       = require('rc')
var optimist = require('optimist')
var toCC     = require('to-camel-case')
var fs       = require('fs')
var ini      = require('ini')
var osenv    = require('osenv')

var home     = osenv.home()
var tmp      = osenv.tmpdir()

function obsfucate (s) {
  return s.replace(/./g, '*')
}

function dumpConfig (config) {
  var _config = JSON.parse(JSON.stringify(config))
  if (_config.credentials)
    _config.credentials.pass = obsfucate(_config.credentials.pass)
  if (_config._auth)
    _config._auth = obsfucate(_config._auth)
  if (_config.Auth)
    _config.Auth = obsfucate(_config.Auth)
  console.log(JSON.stringify(_config, null, 2))
}

var config = module.exports = (function () {
  // *** vvv Copied this stuff out of npmconf **********************
  var uidOrPid = process.getuid ? process.getuid() : process.pid

  if (home) process.env.HOME = home
  else home = path.resolve(tmp, "npm-" + uidOrPid)

  var cacheExtra = process.platform === "win32" ? "npm-cache" : ".npm"
  var cacheRoot = process.platform === "win32" && process.env.APPDATA || home
  var cache = path.resolve(cacheRoot, cacheExtra)
  // *** ^^^ Copied this stuff out of npmconf **********************

  // the defaults
  var defaults = {
    dbPath: path.join(home, '.npmd'),
    debug: false,
    sync: false,
    registry: 'https://registry.npmjs.org',
    cache: cache,
    "user-agent" : "node/" + process.version
                 + ' ' + process.platform
                 + ' ' + process.arch,
    prefix: (
      process.env.PREFIX ||
      ( process.platform === 'win32' ? path.dirname(process.execPath)
      : path.dirname(path.dirname(process.execPath)))
    ),
    port: 5656,
    global: false,
    greedy: false,
    online: true,
    offline: false,
    'save-dev': false,
    saveDev: false,
    save: false,
  }

  // merge ~/.npmrc on top of the defaults
  if(home) try {
    var c = ini.parse(fs.readFileSync(path.join(home, '.npmrc'), 'utf8'))
    for (var k in c)
      defaults[k] = c[k]
  } catch(e) {}

  // pass default and optimist to rc.
  // note: we must clear the 
  var config = rc('npmd', defaults,
    optimist
      .alias('g', 'global')
      .alias('f', 'force')
      .alias('D', 'save-dev')
      .alias('S', 'save')
      .alias('v', 'version')
      .alias('dedupe', 'greedy')
      .boolean('global')
      .default('global', defaults.global)
      .boolean('greedy')
      .default('greedy', defaults.greedy)
      .boolean('online')
      .default('online', defaults.online)
      .boolean('offline')
      .default('offline', defaults.offline)
      .boolean('save-dev')
      .default('save-dev', defaults['save-def'])
      .boolean('saveDev')
      .default('saveDev', defaults.saveDev)
      .boolean('save')
      .default('save', defaults.save)
      .argv
  )

  var homePattern = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//
  if (config.prefix.match(homePattern) && home)
    config.prefix = path.resolve(home, config.prefix.substr(2))

  config.bin = config.bin ||
  ( config.global ? path.join(config.prefix, 'bin')
  : path.join(config.path || process.cwd(), 'node_modules', '.bin'))

  if(!config.path && config.global)
    config.path = path.join(config.prefix, 'lib')

  for(var k in config)
    config[toCC(k)] = config[k]

  //parse credentials
  if (config.Auth) {
    var creds = Buffer(config.Auth, 'base64').toString()
    var segs = creds.split(':')
    config.credentials = { user: segs[0], pass: segs[1] }
  }

  if(config.showConfig) dumpConfig(config)
  return config
})()


if(!module.parent)
  dumpConfig(config)


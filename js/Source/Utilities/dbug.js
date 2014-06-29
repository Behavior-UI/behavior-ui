/*
---

name: dbug

description: A wrapper for Firebug console.* statements.

license: MIT-style license.

authors:
 - Aaron Newton

provides: dbug

...
*/
var dbug = {
  logged: [],
  timers: {},
  firebug: false,
  enabled: false,
  log: function(){
    dbug.logged.push(arguments);
  },
  nolog: function(msg){
    dbug.logged.push(arguments);
  },
  time: function(name){
    dbug.timers[name] = new Date().getTime();
  },
  timeEnd: function(name){
    if (dbug.timers[name]){
      var end = new Date().getTime() - dbug.timers[name];
      dbug.timers[name] = false;
      dbug.log('%s: %s', name, end);
    } else dbug.log('no such timer: %s', name);
  },
  enable: function(silent){
    var con = window.firebug ? firebug.d.console.cmd : window.console;

    if((!!window.console && !!window.console.warn) || window.firebug){
      try {
        dbug.enabled = true;
        dbug.log = function(){
            try {
              (con.debug || con.log).apply(con, arguments);
            } catch(e){
              console.log(Array.slice(arguments));
            }
        };
        dbug.time = function(){
          con.time.apply(con, arguments);
        };
        dbug.timeEnd = function(){
          con.timeEnd.apply(con, arguments);
        };
        if(!silent) dbug.log('enabling dbug');
        for(var i=0;i<dbug.logged.length;i++){ dbug.log.apply(con, dbug.logged[i]); }
        dbug.logged=[];
      } catch(e){
        dbug.enable.delay(400);
      }
    }
  },
  disable: function(){
    if(dbug.firebug) dbug.enabled = false;
    dbug.log = dbug.nolog;
    dbug.time = function(){};
    dbug.timeEnd = function(){};
  },
  cookie: function(set){
    var value = document.cookie.match('(?:^|;)\\s*jsdebug=([^;]*)');
    var debugCookie = value ? unescape(value[1]) : false;
    if((set == null && debugCookie != 'true') || (set != null && set)){
      dbug.enable();
      dbug.log('setting debugging cookie');
      var date = new Date();
      date.setTime(date.getTime()+(24*60*60*1000));
      document.cookie = 'jsdebug=true;expires='+date.toGMTString()+';path=/;';
    } else dbug.disableCookie();
  },
  disableCookie: function(){
    dbug.log('disabling debugging cookie');
    document.cookie = 'jsdebug=false;path=/;';
  },
  conditional: function(fn, fnIfError){
    if (dbug.enabled){
      return fn();
    } else {
      try {
        return fn();
      } catch(e){
        if (fnIfError) fnIfError(e);
      }
    }
  }
};

(function(){
  var fb = !!window.console || !!window.firebug;
  var con = window.firebug ? window.firebug.d.console.cmd : window.console;
  var debugMethods = ['debug','info','warn','error','assert','dir','dirxml'];
  var otherMethods = ['trace','group','groupEnd','profile','profileEnd','count'];
  function set(methodList, defaultFunction){

    var getLogger = function(method){
      return function(){
        con[method].apply(con, arguments);
      };
    };

    for(var i = 0; i < methodList.length; i++){
      var method = methodList[i];
      if (fb && con[method]){
        dbug[method] = getLogger(method);
      } else {
        dbug[method] = defaultFunction;
      }
    }
  };
  set(debugMethods, dbug.log);
  set(otherMethods, function(){});
})();
if ((!!window.console && !!window.console.warn) || window.firebug){
  dbug.firebug = true;
  var value = document.cookie.match('(?:^|;)\\s*jsdebug=([^;]*)');
  var debugCookie = value ? unescape(value[1]) : false;
  if(window.location.href.indexOf("jsdebug=true")>0 || debugCookie=='true') dbug.enable();
  if(debugCookie=='true')dbug.log('debugging cookie enabled');
  if(window.location.href.indexOf("jsdebugCookie=true")>0){
    dbug.cookie();
    if(!dbug.enabled)dbug.enable();
  }
  if(window.location.href.indexOf("jsdebugCookie=false")>0)dbug.disableCookie();
}

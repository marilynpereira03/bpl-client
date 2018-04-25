#!/usr/bin/env node
var crypto = require("crypto");
var figlet = require("figlet");
var colors = require("colors");
var request = require("request");
var asciichart = require ('asciichart');
var chart = require ('chart');
var cliSpinners = require('cli-spinners');
var Table = require('ascii-table');
var ora = require('ora');
var cowsay = require('cowsay');
var async = require('async');
var vorpal = require('vorpal')();
var cluster = require('cluster');
var child_process = require('child_process');

var blessed = require('blessed');
var contrib = require('blessed-contrib');

var config = require('./config.json');
var bpljs = require("bpljs");
bpljs = new bpljs.BplClass(config);

var server;
var network;
var ticker = {};
var currencies = ["USD","AUD", "BRL", "CAD", "CHF", "CNY", "EUR", "GBP", "HKD", "IDR", "INR", "JPY", "KRW", "MXN", "RUB"]


var networks = config.configuredNetworks;

function getNetworkFromNethash(nethash){
  for(var n in networks){
    if(networks[n].nethash == nethash){
      return n;
    }
  }
  return "unknown";
}

function findEnabledPeers(cb){
  var peers=[];
  getFromNode('http://'+server+'/peer/list', function(err, response, body){

    if(err){
      vorpal.log(colors.red("Can't get peers from network: " + err));
      return cb(peers);
    }
    else {
      var respeers = JSON.parse(body).peers.map(function(peer){
        return peer.ip+":"+peer.port;
      }).filter(function(peer){
        return peer.status=="OK";
      });
      async.each(respeers, function(peer, cb){
        getFromNode('http://'+peer+'/api/blocks/getHeight', function(err, response, body){
          if(body != "Forbidden"){
            peers.push(peer);
          }
          cb();
        });
      },function(err){
        return cb(peers);
      });
    }
  });
}

function postTransaction(transaction, cb){
  request(
    {
      url: 'http://'+server+'/peer/transactions',
      headers: {
        nethash: network.nethash,
        version: '1.0.0',
        port:1
      },
      method: 'POST',
      json: true,
      body: {transactions:[transaction]}
    },
    cb
  );
}

function getFromNode(url, cb){
  nethash=network?network.nethash:"";
  request(
    {
      url: url,
      headers: {
        nethash: nethash,
        version: '1.0.0',
        port:1
      },
      timeout: 5000
    },
    cb
  );
}

function getWBXTicker(currency){
  request({url: "https://api.coinmarketcap.com/v1/ticker/blockpool/?convert="+currency}, function(err, response, body){
    ticker[currency]=JSON.parse(body)[0];
  });
}

//verifyDelegate: checks if delegate exists
function verifyDelegate(name, cb){
  request({url: "http://"+server+"/api/delegates/get/?username="+name}, function(err, response, body){
    body = JSON.parse(body);
    return cb(err, response, body);
  });
}

//formatTransaction: adds additional properties required to make a vote transaction
function formatTransaction(transaction){
  var d = new Date(Date.UTC(2017,2,21,13,0,0,0))
  var t = parseInt(d.getTime() / 1000);

  transaction['senderId'] = transaction.recipientId;
  transaction['label'] = 'Vote';
  transaction['date'] = new Date((transaction.timestamp + t) * 1000);
  transaction['total'] = -transaction.amount-transaction.fee;
  transaction['humanTotal'] = numberToFixed(transaction.total / 100000000) + '';
  transaction['confirmations'] = 0;

  return transaction;
}

function numberToFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

vorpal
  .command('connect <network>', 'Connect to network. Network is testnet or mainnet')
  .action(function(args, callback) {
    var self = this;
    network = networks[args.network];

      if(!network){
          self.log("Network not found");
          return callback();
      }

    server = network.peers[Math.floor(Math.random()*1000)%network.peers.length];
    findEnabledPeers(function(peers){
      if(peers.length>0){
        server=peers[0];
        network.peers=peers;
      }
    });
    getFromNode('http://'+server+'/api/loader/autoconfigure', function(err, response, body){
      network.config = JSON.parse(body).network;
      console.log(network.config);
    });
    getFromNode('http://'+server+'/peer/status', function(err, response, body){
      self.log("Node: " + server + ", height: " + JSON.parse(body).height);
      self.delimiter('WBX '+args.network+'>');
      callback();
    });
  });


vorpal
  .command('connect node <url>', 'Connect to a server. For example "connect node 5.39.9.251:4000"')
  .action(function(args, callback) {
    var self = this;
    server=args.url;
    getFromNode('http://'+server+'/api/blocks/getNethash', function(err, response, body){
      if(err){
        self.log(colors.red("Public API unreacheable on this server "+server+" - "+err));
        server=null;
        self.delimiter('wbx>');
        return callback();
      }
      try {
        var nethash = JSON.parse(body).nethash;
      }
      catch (error){
        self.log(colors.red("API is not returning expected result:"));
        self.log(body);
        server=null;
        self.delimiter('wbx>');
        return callback();
      }

      var networkname = getNetworkFromNethash(nethash);
      network = networks[networkname];
      if(!network){
        network = {
          nethash: nethash,
          peers:[server]
        }
        networks[nethash]=network;
      }
      getFromNode('http://'+server+'/api/loader/autoconfigure', function(err, response, body){
        network.config = JSON.parse(body).network;
        console.log(network.config);
      });
      self.log("Connected to network " + nethash + colors.green(" ("+networkname+")"));
      self.delimiter('wbx '+server+'>');
      getFromNode('http://'+server+'/peer/status', function(err, response, body){
        self.log("Node height ", JSON.parse(body).height);
      });
      callback();
    });
  });

vorpal
  .command('disconnect', 'Disconnect from server or network')
  .action(function(args, callback) {
    var self = this;
    self.log("Disconnected from "+server);
    self.delimiter('wbx>');
    server=null;
    network=null;
    callback();
  });

vorpal
  .command('network stats', 'Get stats from network')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before");
      return callback();
    }
    getFromNode('http://'+server+'/peer/list', function(err, response, body){
      if(err){
        self.log(colors.red("Can't get peers from network: " + err));
        return callback();
      }
      else {
        var peers = JSON.parse(body).peers.map(function(peer){
          return peer.ip+":"+peer.port;
        });
        self.log("Checking "+peers.length+" peers");
        var spinner = ora({text:"0%",spinner:"shwbx"}).start();
        var heights={};
        var delays={};
        var count=0;
        async.each(peers, function(peer, cb){
          var delay=new Date().getTime();
          getFromNode('http://'+peer+'/peer/status', function(err, response, hbody){
            delay=new Date().getTime()-delay;
            if(delays[10*Math.floor(delay/10)]){
              delays[10*Math.floor(delay/10)]++;
            }
            else{
              delays[10*Math.floor(delay/10)]=1;
            }
            count++;
            spinner.text=Math.floor(100*count/peers.length)+"%";
            if(err){
              return cb();
            }
            else{
              var height=JSON.parse(hbody).height;
              if(!height){
                return cb();
              }
              if(heights[height]){
                heights[height]++;
              }
              else{
                heights[height]=1;
              }
              return cb();
            }
            return cb();
          });
        },function(err){
          spinner.stop();
          var screen = blessed.screen();
          var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})
          var line = grid.set(0, 0, 6, 6, contrib.line,
              { style:
                 { line: "yellow"
                 , text: "green"
                 , baseline: "black"}
               , xLabelPadding: 3
               , xPadding: 5
               , label: 'Delays'});
          var data = {
               x: Object.keys(delays).map(function(d){return d+"ms"}),
               y: Object.values(delays)
            };
          screen.append(line); //must append before setting data
          line.setData([data]);

          var bar = grid.set(6, 0, 6, 12, contrib.bar, { label: 'Network Height', barWidth: 4, barSpacing: 6, xOffset: 0, maxHeight: 9})
          screen.append(bar); //must append before setting data
          bar.setData({titles: Object.keys(heights), data: Object.values(heights)});

          screen.onceKey(['escape'], function(ch, key) {
            screen.destroy();
          });
          screen.render();
        });
      }
    });

  });

vorpal
  .command('account status <address>', 'Get account status')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before.");
      return callback();
    }
    var address=args.address;
    getFromNode('http://'+server+'/api/accounts?address='+address, function(err, response, body){
      var a = JSON.parse(body).account;

      if(!a){
        self.log("Unknown on the blockchain");
        return callback();
      }
      for(var i in a){
        if(!a[i] || a[i].length==0) delete a[i];
      }
      delete a.address;
      var table = new Table();
      table.setHeading(Object.keys(a));
      table.addRow(Object.values(a));
      self.log(table.toString());
      getFromNode('http://'+server+'/api/delegates/get/?publicKey='+a.publicKey, function(err, response, body){
        var body = JSON.parse(body);
        if(body.success){
          var delegate=body.delegate;
          delete delegate.address;
          delete delegate.publicKey;
          table = new Table("Delegate");
          table.setHeading(Object.keys(delegate));
          table.addRow(Object.values(delegate));
          self.log(table.toString());
        }

        callback();
      });
    });
  });

vorpal
  .command('account vote <name>', 'Vote for delegate <name>. Remove previous vote if needed. Leave empty to clear vote')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before");
      return callback();
    }

    async.waterfall([
      function(seriesCb){
        self.prompt({
          type: 'password',
          name: 'passphrase',
          message: 'passphrase: ',
        }, function(result){
          if (result.passphrase) {
            return seriesCb(null, result.passphrase);
          }
          else{
            return seriesCb("Aborted.");
          }
        });
      },
      function(passphrase, seriesCb){
        verifyDelegate(args.name, function(err, response, body) {
          if(body.success) {
            //create array of delegate public keys
            var arr = new Array();
            arr.push('+'+body.delegate.publicKey);

            var transaction = bpljs.vote.createVote(passphrase, arr);
            transaction = formatTransaction(transaction);

            self.prompt({
              type: 'confirm',
              name: 'continue',
              default: false,
              message: 'Vote for '+args.name +' now?',
            }, function(result){
              if (result.continue) {
                return seriesCb(null, transaction);
              }
              else {
                return seriesCb("Aborted.")
              }
            });
          }
          else {
            return seriesCb(body.error)
          }
        });
      },
      function(transaction, seriesCb){
        postTransaction(transaction, function(err, response, body){
          if(err){
            seriesCb("Failed to send transaction: " + err);
          }
          else if(body.success){
            seriesCb(null, transaction);
          }
          else {
            seriesCb("Failed to send transaction: " + body.error);
          }
        });
      }
    ], function(err, transaction){
      if(err){
        self.log(colors.red(err));
      }
      else{
        self.log(colors.green("Transaction sent successfully with id "+transaction.id));
      }
      return callback();
    });
  });

vorpal
  .command('account send <amount> <recipient>', 'Send <amount> wbx to <recipient>. <amount> format examples: 10, USD10.4, EUR100')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before.");
      return callback();
    }
    var currency;
    var found = false;

    if(typeof args.amount != "number")
    {

      for(var i in currencies)
      {
        if(args.amount.startsWith(currencies[i]))
        {
          currency=currencies[i];
          args.amount = Number(args.amount.replace(currency,""));
          getWBXTicker(currency);
          found = true;
          break;
        }
      }

      if(!found)
      {
        self.log("Invalid Currency Format");
        return callback();
      }
    }

    async.waterfall([
      function(seriesCb){
        self.prompt({
          type: 'password',
          name: 'passphrase',
          message: 'passphrase: ',
        }, function(result){
          if (result.passphrase) {
            return seriesCb(null, result.passphrase);
          }
          else{
            return seriesCb("Aborted.");
          }
        });
      },
      function(passphrase, seriesCb){
        var bplamount = args.amount;
        var bplAmountString = args.amount;

        if(currency){
          if(!ticker[currency]){
            return seriesCb("Can't get price from market. Aborted.");
          }
          bplamount = parseInt(args.amount * 100000000 / Number(ticker[currency]["price_"+currency.toLowerCase()]))
          bplAmountString = bplamount/100000000;
        }

        var transaction = bpljs.transaction.createTransaction(args.recipient, bplamount*100000000, null, passphrase);

        self.prompt({
          type: 'confirm',
          name: 'continue',
          default: false,
          message: 'Sending '+bplAmountString+config.network.client.tokenShortName+' '+(currency?'('+currency+args.amount+') ':'')+'to '+args.recipient+' now',
        }, function(result){
          if (result.continue) {
            return seriesCb(null, transaction);
          }
          else {
            return seriesCb("Aborted.")
          }
        });
      },
      function(transaction, seriesCb){
        postTransaction(transaction, function(err, response, body){
          if(err){
            seriesCb("Failed to send transaction: " + err);
          }
          else if(body.success){
            seriesCb(null, transaction);
          }
          else {
            seriesCb("Failed to send transaction: " + body.error);
          }
        });
      }
    ], function(err, transaction){
      if(err){
        self.log(colors.red(err));
      }
      else{
        self.log(colors.green("Transaction sent successfully with id "+transaction.id));
      }
      return callback();
    });
  });

vorpal
  .command('account delegate <username>', 'Register new delegate with <username> ')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before.");
      return callback();
    }
    this.prompt({
      type: 'password',
      name: 'passphrase',
      message: 'passphrase: ',
    }, function(res){
      if (res.passphrase) {
        self.prompt({
          type: 'confirm',
          name: 'continue',
          message: 'Register delegate '+args.username +' now?',
        }, function(result){
          if (result.continue) {
              var transaction = bpljs.delegate.createDelegate(res.passphrase, args.username);
              postTransaction(transaction, function(err, response, body){
              if(body.success){
                self.log(colors.green("Transaction sent successfully with id "+body.transactionIds[0]));
              }
              else{
                self.log(colors.red("Failed to send transaction: "+body.error));
              }
              return callback();
            });
          }
          else {
            self.log('Aborted.');
            return callback();
          }
        });

      } else {
        self.log('Aborted.');
        return callback();
      }
    });
  });

vorpal
  .command('account create', 'Generate a new random cold account')
  .action(function(args, callback) {
    var self = this;
    if(!server){
      self.log("Please connect to node or network before, in order to retrieve necessery information about address prefixing");
      return callback();
    }

    bpljs.crypto.setNetworkVersion(network.config.pubKeyHash);
    var passphrase = require("bip39").generateMnemonic();
    self.log("Seed    - private:",passphrase);
    self.log("WIF     - private:",bpljs.crypto.getKeys(passphrase).toWIF());
    self.log("Address - public :",bpljs.crypto.getAddress(bpljs.crypto.getKeys(passphrase).publicKey));
    callback();
  });

vorpal
  .command('account vanity <string>', 'Generate an address containing lowercased <string> (WARNING you could wait for long)')
  .action(function(args, callback) {
    var self=this;
    if(!server){
      self.log("Please connect to node or network before, in order to retrieve necessery information about address prefixing");
      return callback();
    }

    bpljs.crypto.setNetworkVersion(network.config.pubKeyHash);
    var count=0;
    var numCPUs = require('os').cpus().length;
    var cps=[];
    self.log("Spawning process to "+numCPUs+" cpus");
    var spinner = ora({text:"passphrases tested: 0",spinner:"shwbx"}).start();
    for (var i = 0; i < numCPUs; i++) {
      var cp=child_process.fork(__dirname+"/vanity.js");
      cps.push(cp);
      cp.on('message', function(message){
        if(message.passphrase){
          spinner.stop();
          var passphrase = message.passphrase;
          self.log("Found after",count,"passphrases tested");
          self.log("Seed    - private:",passphrase);
          self.log("WIF     - private:",bpljs.crypto.getKeys(passphrase).toWIF());
          self.log("Address - public :",bpljs.crypto.getAddress(bpljs.crypto.getKeys(passphrase).publicKey));

          for(var killid in cps){
            cps[killid].kill();
          }
          callback();
        }
        if(message.count){
          count += message.count;
          spinner.text="passphrases tested: "+count;
        }
      });
      cp.send({string:args.string.toLowerCase(), version:network.config.version});
    }

  });

vorpal
  .command('message sign <message>', 'Sign a message')
  .action(function(args, callback) {
    var self = this;
    return this.prompt({
      type: 'password',
      name: 'passphrase',
      message: 'passphrase: ',
    }, function(result){
      if (result.passphrase) {
        var hash = crypto.createHash('sha256');
        hash = hash.update(new Buffer(args.message,"utf-8")).digest();
        self.log("public key: ",bpljs.crypto.getKeys(result.passphrase).publicKey);
        self.log("address   : ",bpljs.crypto.getAddress(bpljs.crypto.getKeys(result.passphrase).publicKey));
        self.log("signature : ",bpljs.crypto.getKeys(result.passphrase).sign(hash).toDER().toString("hex"));

      } else {
        self.log('Aborted.');
        callback();
      }
    });
  });

vorpal
  .command('message verify <message> <publickey>', 'Verify the <message> signed by the owner of <publickey> (you will be prompted to provide the signature)')
  .action(function(args, callback) {
    var self = this;
    return this.prompt({
      type: 'input',
      name: 'signature',
      message: 'signature: ',
    }, function(result){
      if (result.signature) {
        try{
          var hash = crypto.createHash('sha256');
          hash = hash.update(new Buffer(args.message,"utf-8")).digest();
          var signature = new Buffer(result.signature, "hex");
          var publickey= new Buffer(args.publickey, "hex");
          var ecpair = bpljs.ECPair.fromPublicKeyBuffer(publickey);
          var ecsignature = bpljs.ECSignature.fromDER(signature);
          var res = ecpair.verify(hash, ecsignature);
          self.log(res);
        }
        catch(error){
          self.log("Failed: ", error);
        }
        callback();
      } else {
        self.log('Aborted.');
        callback();
      }
    });

  });
var shwbxspinner;
vorpal
  .command("shWBX", "No you don't want to use this command")
  .action(function(args, callback) {
    var self = this;
    self.log(colors.red(figlet.textSync("shWBX")));
    shwbxspinner = ora({text:"Watch out, the shWBX attack!",spinner:"shwbx"}).start();
    callback();
  });

vorpal
  .command("spWBXaaaaa!")
  .hidden()
  .action(function(args, callback) {
    var time = 0;
    var self=this;
    shwbxspinner && shwbxspinner.stop();
    ["tux","meow","bunny","cower","dragon-and-cow"].forEach(function(spbpl){
      setTimeout(function(){
        self.log(cowsay.say({text:"SPAAAAWBXXXXXX!", f:spbpl}));
      }, time++*1000);
    });

    callback();
  });

vorpal.history('wbx-client');

vorpal.log(colors.cyan(figlet.textSync("Wbx Client","Slant")));

vorpal
  .delimiter('wbx>')
  .show();

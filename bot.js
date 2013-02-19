var oplist = require("./oplist.json"),
  config = require("./config.json"),
  irc = require("irc"),
  bot = new irc.Client(config.server, config.botName, config),
  botname = config.botName, // this might change after connection
  actions = {};

bot.addListener("registered", function(channel, who) {
  botname = bot.nick;
  console.log("botname", botname)
});

actions.botHasOps = false;

config.channels.forEach(function(channel) {
  bot.addListener("names" + channel, function(nicks) {
    console.log("Nicks for channel: " + channel, nicks);

    if(nicks[botname] && nicks[botname] === "@") {
      actions.botHasOps = true;
    }

    if(Object.keys(nicks).length === 1 && !actions.botHasOps) {
      console.log("Empty channel, hop");
      bot.part(channel);
      bot.join(channel);
      return;
    }

    if(!actions.botHasOps) {
      console.log("Bot doesn't have ops");
      return;
    }

    if(actions.callback) {
      actions.callback.call(nicks);
      return;
    }

    for(nick in nicks) {
      oplist.forEach(function(user) {
        if(nick === user.nick && nicks[nick] !== "@") {
          actions.opUser(user, channel);
        }
      });
    }
  });
});

actions.op = function(nick, channel) {
  bot.send('MODE', channel, '+o', nick);
};

actions.names = function(channel) {
  console.log("Asking for names", channel);
  bot.send('names', channel);
};

actions.opUser = function(user, originalChannel) {
  if(user.channels === "all") {
    if(originalChannel) {
      actions.op(user.nick, originalChannel);
      return;
    }
    config.channels.forEach(function(channel) {
      actions.op(user.nick, channel);
    });
  } else {
    user.channels.forEach(function(channel) {
      if(originalChannel) {
        if(channel === originalChannel) {
          actions.op(user.nick, channel);
        }
        return true;
      }
      actions.op(user.nick, channel);
    });
  }
};

actions.opAll = function(channel, nicks) {
  console.log("nicks for all", nicks)
  oplist.forEach(function(user) {
    if(nicks[user.nick] && nicks[user.nick] !== "@") {
      actions.opUser(user, channel);
    }
  });
};

// Listen for joins
bot.addListener("join", function(channel, who) {
  actions.names(channel);
});

/*
// Listen for parts
bot.addListener("part", function(channel, who) {
  actions.names(channel);
});
*/


/*
// Listen for names
bot.addListener("names", function(channel, nicks) {
  if(nicks[botname] === "@") {
    actions.botHasOps = true;
  }

  if(Object.keys(nicks).length === 1 && !actions.botHasOps) {
    console.log("Empty channel, hop");
    bot.part(channel);
    bot.join(channel);
    return;
  }

  if(actions.opProcess === true) {
    actions.callback.call(nicks);
    actions.opProcess = false;
    return;
  }

  if(!actions.botHasOps) {
    return;
  }

  for(nick in nicks) {
    oplist.forEach(function(user) {
      if(nick === user.nick && nicks[nick] !== "@") {
        config.channels.forEach(function(channel) {
          actions.opUser(user, channel);
        });
      }
    });
  }
});
*/

bot.addListener("error", function(message) {
  console.log("Error:", error);
});

// Listen for any message, PM said user when he posts
bot.addListener("message", function(from, to, text, message) {
  text = text.toLowerCase();
  if(text === "op" /* || text === "opall" */ ) {
    actions.callback = function() {
      console.log("YAYAYAYAY")
      if(this[from] === "@" || !actions.botHasOps) {
        return;
      }
      if(!to.match("#")) {
        return;
      }

      if(text === "op") {
        oplist.forEach(function(user) {
          if(from === user.nick && message.prefix === user.prefix) {
            actions.opUser(user, to);
          }
        });
      }
      /*
      if(text === "opall") {
        console.log("OP ALL")
        actions.opAll(to, this);
      }
      */
    };


    actions.names(to);
    return;
  }

  var commands = text.split(" ");
  if(commands[0] === "join") {
    var channel = commands[1];
    bot.join(channel);
    return;
  }


  console.log("MESSAGE was received but not understoow:", text);


});

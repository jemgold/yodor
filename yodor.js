Yodors = new Meteor.Collection('yodors');

if (Meteor.isClient) {
  Template.friendsList.friends = function() {
    var friends = Meteor.user().profile.friends || [];
    return Meteor.users.find({'_id': {'$in': friends}}).fetch();
  };

  Template.everyone.users = function() {
    return Meteor.users.find({}).fetch();
  };

  Template.friend.events({
    'click li': function () {
      if (Meteor.user() !== null) {
        Yodors.insert({from: Meteor.userId(), to: this._id, createdAt: +(new Date())});

        var to = Meteor.users.findOne({'_id': this._id});
        var toFriends;

        addUserToFriends(to, Meteor.userId());
      }
    }
  });

  Template.addFriend.events({
    'submit form': function(event, template) {
      event.preventDefault();
      var usernameField = template.find('#friend-username')
      var username = usernameField.value.trim().toLowerCase();
      var newFriend = Meteor.users.findOne({username: username});
      var friends = Meteor.user().profile.friends;

      usernameField.value = '';

      if (newFriend) {
        addUserToFriends(Meteor.user(), newFriend._id);
      } else {
        // TODO: nice notification
        alert('No such user!');
      }

      return false;
    }
  });

  function addUserToFriends(target, newUserId) {
    if ( !_.contains(target.profile.friends, newUserId) ) {
      Meteor.users.update(target._id, {'$push': {'profile.friends': newUserId} });
    }
  }

  Template.friend.count = function() {
    return Yodors.find({to: this._id, from: Meteor.userId()}).count();
  }

  Template.yodors.yodors = function() {
    return Yodors.find({to: Meteor.userId()}, {sort: {createdAt: -1}}).map(function(doc, index, cursor) {
      // console.log(doc);
      doc.username = Meteor.users.findOne({_id: doc.from}).username;
      return doc;
    });
  }

  Template.registerForm.events({
    'submit #register-form': function(event, template) {
      event.preventDefault();
      var username = template.find('#register-username').value.trim().toLowerCase();

      Accounts.createUser({username: username, password: Meteor.uuid()}, function(err) {
        if (err) {
          console.log(err);
        } else {
          // console.log(Meteor.user());
        }
      });

      return false;
    }
  });

  document.addEventListener("touchstart", function(){}, true);

}

if (Meteor.isServer) {
  var hodorId;
  Meteor.startup(function () {
    if (Meteor.users.find({}).count() === 0) {
      hodorId = Accounts.createUser({username: 'hodor', password: Meteor.uuid()});
    }
  });

  Accounts.onCreateUser(function(options, user) {
    user.profile = {friends: [hodorId]};
    // TODO: send phone verification
    return user;
  });

  // TODO: create phone verification
}


Handlebars.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);

  if (optionalValue) {
    console.log("Value"); 
    console.log("====================");
    console.log(optionalValue);
  } 
});

Meteor.users.allow({
  update: function(userId, user, fields, modifier) {
    if (userId === user._id) {
      if (fields.length !== 1 || fields[0] !== 'profile') {
        return false;
      }
      return true;
    } else {
      if (_.has(modifier, '$push') && _.has(modifier['$push'], 'profile.friends') && modifier['$push']['profile.friends'] === userId) {
        return true;
      }
      return false;
    }
  }
});

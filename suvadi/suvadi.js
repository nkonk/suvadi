// Well this thing is indeed a single page application
// All the backend frontend and DB provider code is right here.

//Come on, ill show  u around.

//COMMON AREA
// This section of code is common to both the client and the server
//Both are contextually exec'ed on the client and the server(so produce appropriate behviour)


//Declare a collection to store the news items
//if available it'll use it,otherwise itll create one
NewsItems = new Mongo.Collection('newsitems');

Pages = new Meteor.Pagination(NewsItems,{perPage:5,
itemTemplate:'newsItem',
templateName:'newsList',
sort:{CreatedAt:-1}
});


//================Routing stack ===============================================
//watch out for the wires.kinda messy here

///Default 'index' route
Router.route('/',{
template:'newsList',
name:'newsList'
});

//Registration route
Router.route('/register',{
  template:'RegisterForm'
});

//LogOut route
Router.route('logout',{
  template:'newsList'
},function(){
  //console.log('just seeing if this gets execed');
  Meteor.logout();
});

//Login route
Router.route('/login',{
  template:'loginForm'
});

//And last but very posh looking upvoting regexed route. to allow upvoting
//only to registered users ,of course.
Router.route('/upvote/:_id',{
  template:'newsList',
  onBeforeAction:function(){
    if(Meteor.userId()){
      Meteor.call('incrementUpvote',this._id,Meteor.userId());
      this.next();//continue rendering newsList beyond this point
    }
    else{
      //not logged in , show the way to login page ;)
      this.render('loginForm');
    }
  }
});

//END OF COMMON CODE (curtain falls ;) ==========================================


//BEGIN CLIENT ONLY CODE (curtain rises(on a browser maybe) ;) )=================

if (Meteor.isClient) {
//Quench hunger.
//Setup subscriptions for pulling in data
Meteor.subscribe('NewsItemsPub');

//Dump the lot through the newsList template
  Template.newsList.helpers({
    newsItems: function () {
      //not used with paginator
      return NewsItems.find({},{'sort':{CreatedAt:-1}});//sort values from db chronologically
    }
  });

//Setup event handlers for logging off (thats all the main newsList template handles)

Template.newsList.events({
  'click .logout':function(event){
    event.preventDefault();
    Meteor.logout();//logout the user, nothing special here
  }
});

//Setup click handlers on the cute arrows for upvoting their items 
  Template.newsItem.events({
    'click .upvote': function () {
      // increment the votes when the upvote button is clicked
      //wait first lets see if she's logged in
      if(Meteor.userId()){
      Meteor.call('incrementUpvote',this._id,Meteor.userId(),function(err,alreadyVoted){
        if(!err){
            if(alreadyVoted){
              //jQuery madness here.. The only comedy scene in this lil show.
                 $('#errorbar').html('You have already voted on this one').fadeIn(300).fadeOut(5000);
            }
        }else{
          //Go to mom and complain now. Go. Reminds me of sis.
          console.log('Ran into error while calling incrementUpvote '+err);

        }
      });
    }
    else{
        //Lol we are not supposed to reach here.
        //If at all we do by some magic, we'll have to go back home.
        //Route.go('newsList');
    }
  }
  });
//Register jquery validate plugin for Register form
Template.RegisterForm.onRendered(function(){
    $('#registerForm').validate({
      rules:{
        pass:{
          minlength:4
        },
        passconf:{
          equalTo:'#pass'
        },
        email:{
          required:true,
          email:true
        }
      }
    });
});

// Register form submission handling, its getting boring isnt it ? :( 
    Template.RegisterForm.events({
    'submit form': function (event) {
      event.preventDefault();
      var email  = $('[name=email]').val();
       var uname  = $('[name=uname]').val();
      var pass = $('[name=pass').val();
      var passConf = $('[name=passconf]').val();
//Christen an account if everything goes well.
      Accounts.createUser({
        username: uname,
        password: pass,
        email: email,
      }, function (error) {
        // handle registration errors

        if(error){
          console.log('registration failed coz : ' + error.reason);
          //Mayday Mayday Mayday.. 
        }
        else{
      Router.go('newsList');
      //Lol all good.. Welcome aboard saar/maaadam. 
        }
      });
     
    }
  });

//Register jquery validate plugin for Login form
Template.loginForm.onRendered(function(){
    $('#loginForm').validate({
      rules:{
        email:{
          required:true,
          email:true
        }
      }
    });
});

//Login form submission handler
  Template.loginForm.events({
    'submit #loginForm': function (event) {
      event.preventDefault();
      var email  = $('[name=email]').val();
      var pass = $('[name=pass').val();
      Meteor.loginWithPassword(email, pass,function(error){
        if(error){
           console.log('Log on failed bcoz :' + error.reason);
           $('#errorbar').html('Login failed because : '+error.reason).fadeIn(300).delay(3000).fadeOut(500);
           
        }
       else{
         Router.go('newsList');
         // after loggin in duly escort the user back to the main page.
       }
      });
     
      
    }
  });
//Register jquery validate plugin for addNewsForm
Template.addNewsForm.onRendered(function(){
    $('#addNewsForm').validate({
      errorLabelContainer:'#errorMessageHolder',
      rules:{
        url:{
          required:true,
          url:true
        }
      },
      messages:{
        url:{
          message:"required !"
        }
      }
    });
});

//Add news item form 
  Template.addNewsForm.events({
    'submit form':function(event){
      event.preventDefault();
      //console.log("Forms getting submitted");
      var URL = encodeURI(event.target.url.value);
      //perform sanitiztion before storage and reverse before disp
       $('#errorbar').html('Please Wait Loading Title Content').fadeIn(300).delay(1000).fadeOut(500);
       $('[name=url]').attr('disabled','disabled');
       $('button').attr('disabled','disabled');

      Meteor.call('addNewsItem',URL,function(err){
        if(!err){
          $('#errorbar').css('background-color','lightgreen');
         $('#errorbar').html('Success : Added URI to the list').fadeIn(300).delay(1500).fadeOut(500);
         $('#errorbar').css('background-color','red');
$('[name=url]').removeAttr('disabled');
       $('button').removeAttr('disabled');
         Router.go('newsList');
        }else{
       $('#errorbar').html('Adding URL failed because : '+err).fadeIn(300).delay(4000).fadeOut(500);
         $('[name=url]').removeAttr('disabled');
       $('button').removeAttr('disabled');
        }
      });
     
      Router.go('newsList');
      
    }
  });
}

// END OF CLIENT CODE curtain drops suddenly ==============================

//INTERMISSION is recommened here, climax coming soon

//BEGIN Server side code (scene opens in a murky buzzing server room)======

if (Meteor.isServer) {
  //MODELS
  //News item model is the only supermodel we have here. ;)
   var NewsItem = function(title,url,votes,userId){
        this.Title = title;
        this.Votes = votes||0;
        this.URL = url;
        this.VotedUsers = [];
        this.addedBy = userId;
        this.CreatedAt = new Date();
        };

//Setup publishes to pump data to the client, well we had the bucket there..
// This is the main (to be honest,the ONLY) publish we do to the clients here.
Meteor.publish('NewsItemsPub',function(){
  return NewsItems.find({},{
    //Appreciate the bandwidth saving by stopping VotedUsers and 
    //CreatedAt from going on the ride to the client.
    fields:{VotedUsers:0,CreatedAt:0},
    'sort':{CreatedAt:-1}
  });

});


//We'll kind of Wierd i know.. but consider this a flashback scene.. 
//Startup code for the server, execute only on startup.
  Meteor.startup(function () {
    console.log('Server starting Up !');
    //Funny !! 

    //Code to run on server at startup
    //It had code to populate the mongodb document with dummy news items
    //runs only if the document is empty
   //NewsItems.remove({});//purge the db
    if(NewsItems.find({}).count() === 0){
      //Preloader was here
      //Not preloading anything to keep slate clean,if required add here

    }
  });

// Useless flashback for now.. but while making this app this section was kind of 
//abused badly. left for historical purposes :D  

// Well we noticed the clients could go nasty sometimes.
// so we decided to delegate the responsibilty of touching the DBs to Mr. Server.

//Methods that can be called  by client to perform actions.
  Meteor.methods({
    //he does what he says.. +1's the upvote for the news item he's called upon.

    incrementUpvote:function(id,userId){
      if(Meteor.userId()){
        try{
           var vu = NewsItems.findOne({_id:id}).VotedUsers;
            if(vu.indexOf(userId) === -1 ){
          NewsItems.update({_id:id}, {$inc:{Votes:1},$push:{VotedUsers:userId}});
      //increment Votes by 1 if user hasn't already upvoted it.
        return false;
        }

        else{
          //complain to me if the user tries to vote again
          console.log(userId+' already voted on this one');
          return true;
        }
      
      }
        catch(e){
          console.log('got into a stupid situation :(' + e)
            return false;
        }   
    }
    else{
    //We wont reach this place because we've handled this in our routing  
    //This is just a double check and forces the app to load the main page
    //Routes.go('newsList');
    }
    },
    //again rajnikanth fan.. does what he says.. says what he does.
    // adds a news item into the big list.
    addNewsItem:function(url){
      var request = Meteor.npmRequire('request');
      //Well we had to call  up this guy to do all the fancy requests to 
      //the URLS the ppl provide.
      //We kinda rely on the client template to encode the URL before sending it.
      //If u are really worried like me then u can do encodeURI again on this guy.
      var newsTitle = Async.runSync(function(done){
           request({
            //set the stage for some 3rd party action.
        uri:encodeURI(url),
        method:"GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirect: true,
        maxRedirects:16
        //i know its a funny number. but the amazon.com kinda used it all up. Champ site.
      }, function(error,response,body){
        if(!error){
          //I'm proud of u buddy.. Regular expression to poke out the title tag contents from the webpage.
        var titleregexp = /<title>\s*(.+?)\s*<\/title>/i ;
        var title = body.toString().match(titleregexp)[1];
        done(null,title);
      }else{
        done('netError',"");
        //We'll if we hit a problem we do have someone to blame actually.the network.
      }
      });});
      // third party show ends, stage is dismantled.
      //show off the inner beauty of the newly added newsitem to NOBODY watching the server console.

      //console.log(newsTitle);
      if(!newsTitle.error){
      var userid = Meteor.userId();
      var newsItem = new NewsItem(newsTitle.result, url, 0,userid);
      NewsItems.insert(newsItem);
      console.log(newsItem)
      //Finally add that precious little thing into the NewsItems collection
      //return null;
      }
      else{
        return newsItem.error;
      }
    }
  });
}
// Climax music plays.. 

// Credit Rolls
// Built with  <3  by ONK (Naresh Kumar N. (as span ppl want me to write it))

//Now lets go back to home and try to live happily ever after.

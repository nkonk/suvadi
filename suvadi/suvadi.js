//Commmon stuff
//A collection to store the news items
 NewsItems = new Mongo.Collection('newsitems');
//and a collection to maintain user data
//Users  = new Mongo.Collection('users');



//Some routing over here to different views
Router.route('/',function(){
  this.render('newsList');
});



Router.route('/upvote/',function(){
  //or if he is a user then increment the vote

  if (!Meteor.userId()) {
    this.redirect('loginForm');
  } else {
 this.redirect('newsList');
  }
 
});

Router.route('/upvote/:_id',function(){
  if(Meteor.userId()){
  Meteor.call('incrementUpvote',this._id,Meteor.userId());
  this.render('newsList');
}
else{
  this.render('newsList');
}
});

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);
console.log(NewsItems);
  Template.newsList.helpers({
    newsItems: function () {
      return NewsItems.find({});
    }
  });



  Template.newsItem.events({
    'click .upvote': function () {
      // increment the votes when the upvote button is clicked
      if(Meteor.userId()){
      Meteor.call('incrementUpvote',this._id,Meteor.userId());
    }
    else{

    }
  }
  });

  Template.addNewsForm.events({
    'submit form':function(event){
      event.preventDefault();
      //console.log("Forms getting submitted");
      var URL = event.target.url.value;
      //TODO:perform sanitiztion before storage and reverse before disp
      var xhttp = new XMLHttpRequest();
      // Perform an vanilla AJAX call to fetch the page title
    }
  });
}

if (Meteor.isServer) {

  Meteor.startup(function () {
    // code to run on server at startup
    //for now we'll have code to populate the mongodb document with dummy news items
    //runs only if the document is empty
    console.log('Server starting Up !');
   NewsItems.remove({});//empty the doc store
    if(NewsItems.find({}).count() === 0){
        console.log('Populating document store !');
      var newsItem = function(title,url,votes){
        this.Title = title;
        this.Votes = votes;
        this.URL = url;
        this.CreatedAt = new Date();
                    }
        
        
        NewsItems.insert(new newsItem("Nasa launches Laika ",'', 9000));
        NewsItems.insert(new newsItem("Announcing .NET Core and ASP.NET 5 RC ",'', 30));
        NewsItems.insert(new newsItem("An Ode to Kai's Power Goo ",'', 30))
        NewsItems.insert(new newsItem("qAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        NewsItems.insert(new newsItem("aAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        NewsItems.insert(new newsItem("sAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        NewsItems.insert(new newsItem("xAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        NewsItems.insert(new newsItem("cAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        NewsItems.insert(new newsItem("vAnnouncing .NET Core and ASP.NET 5 RC ",'', 30))
        
      
       

    }
  });

  // Server Code

  Meteor.methods({
    incrementUpvote:function(id,userId){
      NewsItems.update({_id:id}, {$inc:{Votes:1}});
      //increment Votes by 1 if i call this guy
    
    },
    addNewsItem:function(url){
      var http = Meteor.npmRequire('http');
      var newsTitle = Async.runSync(function(done){
        //var options = {
          //path:url,
          //agent:false
        //};
        
        callback = function(response){ response.on('data',function(data){

          //console.log('testdata');
          //console.log(data);
          //in future we'll prevent loading of full doc and stop when we reach </head> ideally. 
          var titleregexp = /<title>\s*(.+?)\s*<\/title>/i ; //a pinch of regexp to pull in the title
          var title = data.toString().match(titleregexp)[1]; //take out the extracted contents of the title
          done(null,title);
        })};
        http.request(url,callback).end();

      });
      //console.log(newsTitle.result);
    }
  });
}

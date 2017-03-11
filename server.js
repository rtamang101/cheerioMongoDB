var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request'); 
var cheerio = require('cheerio');
var exhbs = require('express-handlebars');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static('public'));

mongoose.connect('mongodb://localhost/mongoScrape');
var db = mongoose.connection;

db.on('error', function(err){
	console.log('Mongoose error: ', err);
});

db.once('open', function(){
	console.log("Mongoose successful");
});

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

app.get('/', function(req, res){
	res.send(index.html);
});


app.get('/scrape', function(req, res){
	request('http://abcnews.go.com/', function(error, response, html){
		var $ = cheerio.load(html);

		$('h1').each(function(i, element){
			var result = {};
			result.title = $(this).children('a').text();
			
			result.link = $(this).children('a').attr('href');

			var entry = new Article (result);
			entry.save(function(err, doc){
				if(err) {
					console.log(err);
				} else {
					console.log(doc);
				}
			});

		});
	});

	res.send("Scrape Complete");
});


app.get('/articles', function(req, res){
	Article.find({}, function(err, doc){
		if(err){
			console.log(err);
		} else { res.json(doc); }
	});
});


app.get('/articles/:id', function (req, res){
	Article.findOne({'_id': req.params.id})
	.populate('note')
	.exec(function(err, doc){
		if(err){
			console.log(err)
		} else { res.json(doc) }
	});
});


app.post('/articles/:id', function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(err, doc){
		if (err) {
			console.log(err);
		} else {

			Article.findOneAndUpdate({'_id': req.params.id}, {'note': doc._id})
			.exec(function(err, doc){
				if(err){
					console.log(err);
				} else { res.send(doc); }
			});
		}
	});
});


app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});





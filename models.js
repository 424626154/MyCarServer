var config = require('./config.json');
// var uri = 'mongodb://username:password@hostname:post/databasename';
var host = config.host;
var port = config.port;
var dbName = config.dbname;
var uri = 'mongodb://' + host + ':' + port + '/' + dbName
var mongoose = require('mongoose')
console.log('uri:', uri)
mongoose.connect(uri);

var CacheTimeSchema = new mongoose.Schema({
	statustime: Number,
	citystime: Number
});

var CarStatusScheme = new mongoose.Schema({
	resdata: String
})
var CarCitysScheme = new mongoose.Schema({
	resdata: String
})
mongoose.model('CacheTime', CacheTimeSchema);
mongoose.model('CarStatus', CarStatusScheme);
mongoose.model('CarCitys', CarCitysScheme);
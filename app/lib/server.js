/**
* These are server related tasks
* 
* 
*/

//Dependencies
var http = require('http'); //requiring the http module and assigning it to the variable http
var https = require('https');
var StringDecoder = require('string_decoder').StringDecoder;
var url = require('url'); 
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

//Instantiate the server module object
var server = {};

// Instantiating the HTTP server
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
}); 


//Instantiating the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem')) 
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
});


//All the server logic for both the http and https server
server.unifiedServer = function(req, res){
    //Get the url and parse it
    var parsedUrl = url.parse(req.url, true);

    //Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,''); //first param is a regular expression

    //Get the query string as an Object
    var queryStringObject = parsedUrl.query;

    //Get HTTP method
    var method = req.method.toLowerCase();

    //Get the headers as an object
    var headers = req.headers; 

    //Get the payload if there is any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();
        
        //Choose the handler this request should go to.
        //If one is not found, use the not found handler.
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        //Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            //Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            //Use the payload called back by the handler or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};
            //Convert the paylooad to a string
            var payloadString = JSON.stringify(payload);
            //Return the response or Send the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);   
            console.log('Returning this response: ', statusCode, payloadString);
        });    
    });
};

//Defining a Request Router
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks 
};

//Init script
server.init = function(){
    //Start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
        console.log("The server is listening on port "+config.httpPort);
    });

    //Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log("The server is listening on port "+config.httpsPort);
    });
};
//Export the module
module.exports = server;
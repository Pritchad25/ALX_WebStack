/**
 * 
 * Primary file for the API
 */

//Dependencies
var http = require('http');

//The server should respond to all requests with a string
var server = http.createServer(function(req, res){
    res.end('Hello World, Its Time For An Expert!\n');
});

//Start the HTTP Server and have it listen on port 3000
server.listen(3000, function(){
    console.log("The server is listening on port 3000 now");
});
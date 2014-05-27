var app = require('http').createServer(function (req, res) {
  if(req.url === "/"){
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
          }
          res.writeHead(200);
          res.end(data);
        });
  }
  else{
    fs.readFile(__dirname + req.url, function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' +req.url);
      }
      res.writeHead(200);
      res.end(data);
    });
  }
}).listen(5000)
, fs = require('fs')
, kinect = require('kinect')
, BufferStream = require('bufferstream')
, $ = require('jquery');
var websocket = require('websocket-stream');
var socket = websocket('ws://localhost:3000');
var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({server: app});


var kstream = new BufferStream();


socket.on('data', function (data) {
  // console.log('new data!', data, typeof(data))
  // console.log('new data!');
  kstream.write(data);
  

});

wss.on('connection', function(ws) {
  var stream = websocket(ws);
  kstream.pipe(stream);
  console.log("connection made");
  ws.on('close', function() {
    stream.writable=false;
    console.log('closed socket');
  });

});

socket.on('end', function(){
  console.log("stream ended");
  // socket.close();
});

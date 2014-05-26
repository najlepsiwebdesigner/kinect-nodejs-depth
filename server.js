var app = require('http').createServer(handler).listen(3000)
, fs = require('fs')
, kinect = require('kinect')
, BufferStream = require('bufferstream')
, $ = require('jquery')
, WebSocketServer = require('ws').Server
, websocket = require('websocket-stream')
, wss = new WebSocketServer({server: app});

function handler (req, res) {
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
}


var dataBroadcasted = 0; // in bytes
var startTime = process.hrtime()[0]; // in seconds
var time, previousTime = 0;



var kcontext = kinect();

kcontext.resume();

kcontext.start('depth');


// simple frame skipping counter
var counter = 0;




var kstream = new BufferStream();

kcontext.on('depth', function (buf) {

  if (counter % 3 == 0) { // keep every 25th frame
      kstream.write(buf);
      dataBroadcasted += toArrayBuffer(buf).byteLength;

  }
  counter++;

  if (counter == 100) {
    counter = 0;
  }
  
  time = process.hrtime()[0] - startTime;

  if (time != previousTime) {
    console.log("Broadcasting data ~" + (dataBroadcasted / 1048576).toFixed(2) + " MB/s"); // in megabytes
    previousTime = time;
    dataBroadcasted = 0;
  }

  // console.log(process.hrtime());

  // exit nodejs code
  // process.exit(code=0)
  // process.exit(1);
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





// helper functions for buffers from 
// http://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}


function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}


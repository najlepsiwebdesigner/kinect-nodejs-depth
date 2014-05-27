var app = require('http').createServer(handler).listen(5000)
, fs = require('fs')
, kinect = require('kinect')
, BufferStream = require('bufferstream')
, $ = require('jquery');
var websocket = require('websocket-stream');
var socket = websocket('ws://localhost:3000');
var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({server: app});
var compress = require('compress-buffer').compress
, uncompress = require('compress-buffer').uncompress;


var kstream = new BufferStream();


var COMPRESSION = true;


socket.on('data', function (data) {

  console.log('data forward');
  if (COMPRESSION) {
    data = uncompress(data);
    if (data != undefined) {
      data = slowBufferToBuffer(data)
      kstream.write(data);
    }
  }
  else {
    kstream.write(data);
  }
      

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



// helper functions for buffers from 
// http://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer


function slowBufferToBuffer(slowBuffer){
  var buffer = new Buffer(slowBuffer.length);
  slowBuffer.copy(buffer);

  return buffer;  
  
}


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


function wrapArrayBuffer(arr) {
  return {
    data: arr,
    offset: 0,
    readByte: function() {
      return this.data[this.offset ++];
    },
    writeByte: function(value) {
      this.data[this.offset ++] = value;
    }
  };
};


function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var handler = function (req, res) {
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

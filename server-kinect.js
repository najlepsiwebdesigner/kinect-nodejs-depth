var app = require('http').createServer(handler).listen(3000)
, fs = require('fs')
, kinect = require('kinect')
, BufferStream = require('bufferstream')
, $ = require('jquery')
, WebSocketServer = require('ws').Server
, websocket = require('websocket-stream')
, wss = new WebSocketServer({server: app});
// var lzw = require("node-lzw");
// , lzma = require('lzma-purejs');
// var lzma = require('lzma-purejs');
var compress = require('compress-buffer').compress
, uncompress = require('compress-buffer').uncompress;

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






// variables needed in calculating broadcast speed
var dataBroadcasted = 0; // in bytes
var startTime = process.hrtime()[0]; // in seconds
var time, previousTime = 0;

// simple frame skipping counter
var counter = 0;
var keepEvery = 1; // 1 = every frame, 2 = every second frame, 3 = every third frame

var kcontext = kinect();
var kstream = new BufferStream();
var arrayBuffer = null;

kcontext.resume();
kcontext.start('depth');

kcontext.on('depth', function (buf) {
  if (counter % keepEvery == 0) {
      arrayBuffer = toArrayBuffer(buf);



      // console.log(buf.toString('base64'));


      // var encode = lzw.encode(ab2str(buf));
      // console.log(typeof(encode));
      // console.log('idem komprimuvat!');
      // var inStream = buf // tu su moje data!
      // console.log(arrayBuffer.byteLength);
      // var outStream = wrapArrayBuffer(new ArrayBuffer()) // toto je moj output

      kstream.write(compress(buf));
      // kstream.write(buf.toString('base64'));
      // kstream.write('test');
      // kstream.write(encode);
      // kstream.write(lzma.compressFile(buf));

      // outStream = lzma.compressFile(buf);

      // console.log(outStream, typeof(outStream));

      // console.log(lzma.compressFile(buf));
      // calculate how much i have broadcasted
      dataBroadcasted += arrayBuffer.byteLength;
      // console.log(dataBroadcasted);
  }
  counter++;

  if (counter == 100) counter = 0;
  time = process.hrtime()[0] - startTime;

  if (time != previousTime) {
    console.log("Broadcasting data ~" + (dataBroadcasted / 1048576).toFixed(2) + " MB/s"); // in megabytes
    previousTime = time;
    dataBroadcasted = 0;
  }

  // console.log(process.hrtime());

  // exit nodejs code
  // console.log("Exiting after first frame");
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

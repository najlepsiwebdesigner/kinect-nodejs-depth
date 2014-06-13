var app = require('http').createServer(handler).listen(3000)
, fs = require('fs')
, kinect = require('kinect')
, BufferStream = require('bufferstream')
, $ = require('jquery')
, WebSocketServer = require('ws').Server
, websocket = require('websocket-stream')
, wss = new WebSocketServer({server: app});


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
var useEvery = 2; // 1 = every frame, 2 = every second frame, 3 = every third frame

var kcontext = kinect();
var kstream = new BufferStream();
var arrayBuffer = null;

var DATA_TYPE = 'depth'; // depth || video
var COMPRESSION = true;

kcontext.resume();


kcontext.start(DATA_TYPE);

kcontext.on(DATA_TYPE, function (buf) {
  if (counter % useEvery == 0) {

      buf = reduceBuffer(buf)

      if (COMPRESSION) {
        kstream.write(compress(buf));  
        // calculate how much i have broadcasted
        dataBroadcasted += toArrayBuffer(compress(buf)).byteLength;
      }
      else {
        kstream.write(buf);
        // calculate how much i have broadcasted
        dataBroadcasted += toArrayBuffer(buf).byteLength;
      }

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


function reduceBuffer(buffer) {
  

  // return buffer;



  // var newLength = buffer.length;
  // var newBuffer = new Buffer(newLength)

  // var newBufferCounter = 0;

  // for (var i = 0; i < buffer.length/4; i++) {
  //   if (i % 2 == 0){
  //     // jumping on pixels
  //     newBuffer[newBufferCounter] = buffer[3*i]
  //     newBuffer[newBufferCounter+1] = buffer[3*i+1]
  //     newBuffer[newBufferCounter+2] = buffer[3*i+2]
  //     newBufferCounter++;
  //   }
  // }
  // console.log(buffer.length);
  // console.log(newBuffer.length);
  // console.log(newBufferCounter);
  // return newBuffer;
  // var view = new Uint8Array(buffer)

  // var rowWidth = 640*3; // = collumns
  // var rows = 0;
  // var cols = 0;

  // var newBufferCounter = 0;


  // for (var row = 0; row < 480; row++){
  //   // loop rows

  //   // console.log(row);
  //   for (var col = 0; col < 640; col++){
  //     // console.log(row, col)

  //     if (row % 2 == 0 && col % 2 == 0){
  //       newBuffer[newBufferCounter] = 
  //       newBufferCounter++;
  //     }
  //   }


  // }



  // console.log(buffer.length/640);
  // for (var i = 0; i < buffer.length; i=i+2) {
  //   if (i % rowWidth == 0) {
  //     rows++;
  //     // console.log(i, rows);
  //   }
  //   if (rows % 2 == 0){
  //     newBuffer[i/2] = view[i];  
  //   }
    
  // }

  // var newBufferCounter = 0;

  // for (var i = 0; i < buffer.length; i++) {
  //   if (i % rowWidth == 0) {
  //     rows++;
  //     // i = i+rowWidth;
  //     // console.log(i, rows);
  //   }
  //   if (i % 2 == 0){
  //     newBuffer[newBufferCounter] = view[i];
  //     newBufferCounter++;
  //   }
    
  // }


// console.log("Exiting after first frame");
  // process.exit(code=0)
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

var websocket = require('websocket-stream');
var socket = websocket('ws://localhost:5000');


var DATA_TYPE = 'depth'; // video || depth

console.log("connected");

var width = 640;
var height = 480;
var bytearray;

var ctx = document.getElementById('canvas').getContext('2d');


socket.on('data', function (data) {

  var bytearray = new Uint8Array(data);


  var imgdata = ctx.getImageData(0,0, width, height);
  var imgdatalen = imgdata.data.length;
  for(var i=0;i<imgdatalen/4;i++){


    if (DATA_TYPE == 'video') {
      //for video feed . bytearray [r,g,b,r,g,b...]
      imgdata.data[4*i] = bytearray[3*i];
      imgdata.data[4*i+1] = bytearray[3*i+1];
      imgdata.data[4*i+2] = bytearray[3*i+2];
      imgdata.data[4*i+3] = 255;

    }
    else {
      //for depth feed  . bytearray  [val , mult, val2, mult2, ...]
      var depth = (bytearray[2*i]+bytearray[2*i+1]*255)/3.9;
      imgdata.data[4*i] = depth;
      imgdata.data[4*i+1] = depth;
      imgdata.data[4*i+2] = depth;
      imgdata.data[4*i+3] = 255; 
    }

    
  }
  ctx.putImageData(imgdata,0,0)

});

socket.on('end', function(){
  console.log("stream ended");
  socket.close();
});





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

// function ab2str(buf) {
//   return String.fromCharCode.apply(null, new Uint8Array(buf));
// }

// function str2ab(str) {
//   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
//   var bufView = new Uint8Array(buf);
//   for (var i=0, strLen=str.length; i<strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }
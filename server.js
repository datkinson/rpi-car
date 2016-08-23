// Configuration
var config = require('config');

// OBD2
var OBDReader = require('bluetooth-obd');
var btOBDReader = new OBDReader();
var dataReceivedMarker = {};
var OBDConnection = false;
var lastODBReading = 0;
var OBDDeviceName = config.get('OBD.bluetooth.name');

// Web Server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

 
console.log('Booting...');
if(config.get('OBD.bluetooth.autoconnect')) {
  btOBDReader.on('connected', function () {
    OBDConnection = true;
    console.log('Connected');
    //this.requestValueByName("vss"); //vss = vehicle speed sensor 
 
    this.addPoller("temp");
    this.addPoller("load_pct");
    this.addPoller("map");
    this.addPoller("iat");
    this.addPoller("baro");
    this.addPoller("aat");
    // Speed
    this.addPoller("vss");
    this.addPoller("rpm");
    this.addPoller("throttlepos");
    // Fuel
    this.addPoller("frp");
    this.addPoller("fli");
    this.addPoller("shrtft13");
    this.addPoller("longft13");
    this.addPoller("shrtft24");
    this.addPoller("longft24");
    this.addPoller("fuelsys");
    this.addPoller("enginefrate");
 
    this.startPolling(1000); //Request all values each second. 
  });


  function handleVSS(data) {
    io.sockets.emit('update_vss', data.value);
  }
 
  btOBDReader.on('dataReceived', function (data) {
      console.log(data);
      dataReceivedMarker = data;
      if(typeof data.name !== 'undefined') {
        switch(data.name) {
          case 'vss':
            handleVSS(data);
            break;
          default:
            console.log('Default Data Handle');
            break;
        }
      }
  });

  function maintainOBDConnection() {
    if(!OBDConnection) { 
      try {
        console.log('Autoconnecting...');
        btOBDReader.autoconnect(OBDDeviceName);
      } catch (err) {
        console.log('Error: ', err);
      }
    }
    setTimeout(maintainOBDConnection, 1000);
  } 
  // Kick off OBD connection
  setTimeout(maintainOBDConnection, 1000);
}
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/jquery.js', function(req, res){
  res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});
app.get('/gauge.js', function(req, res){
  res.sendFile(__dirname + '/lib/jquery-guage/jquery-gauge.min.js');
});
app.get('/gauge.css', function(req, res){
  res.sendFile(__dirname + '/lib/jquery-guage/jquery-gauge.css');
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

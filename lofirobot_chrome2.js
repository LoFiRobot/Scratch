(function(ext) {

  var INPUT = 0x00,
    OUTPUT = 0x01,
    ANALOG = 0x02,
    PWM = 0x03,
    SERVO = 0x04,
    SHIFT = 0x05,
    I2C = 0x06,
    ONEWIRE = 0x07,
    STEPPER = 0x08,
    ENCODER = 0x09,
    IGNORE = 0x7F;
    
      var PIN_MODE = 0xF4,
    REPORT_DIGITAL = 0xD0,
    REPORT_ANALOG = 0xC0,
    DIGITAL_MESSAGE = 0x90,
    START_SYSEX = 0xF0,
    END_SYSEX = 0xF7,
    QUERY_FIRMWARE = 0x79,
    REPORT_VERSION = 0xF9,
    ANALOG_MESSAGE = 0xE0,
    ANALOG_MAPPING_QUERY = 0x69,
    ANALOG_MAPPING_RESPONSE = 0x6A,
    CAPABILITY_QUERY = 0x6B,
    CAPABILITY_RESPONSE = 0x6C;
    STRING_DATA = 0x71;
    
    var LOW = 0, HIGH = 1;

	var poller = null;

    var LOFI_ID = "opdjdfckgbogbagnkbkpjgficbampcel"; // APP ID
    var mConnection;
    var mStatus = 0;
    var _selectors = {};
    
    var digitalOutputData = new Uint8Array(16);
    var analogInputData = new Uint16Array(16);
    
    var analogRead1, analogRead2, analogRead3, analogRead0;
	var analog0enable = false;
	var analog1enable = false;
	var analog2enable = false;
	var analog3enable = false;
	
	var pinmode = new Uint8Array(16);
	
	pinmode[2] = 0;
	pinmode[3] = 1;
	pinmode[4] = 0;
	pinmode[5] = 1;
	pinmode[6] = 1;
	pinmode[7] = 0;
	pinmode[8] = 0;
	pinmode[9] = 1;
	pinmode[10] = 1;
	pinmode[11] = 1;
	pinmode[12] = 1;
	pinmode[13] = 1;
	pinmode[14] = 1;
	pinmode[15] = 1;
	pinmode[16] = 1;


	var msg1 = {};
	var msg2 = {};
	
	var dist_read  = 0;
	var last_reading = 0;

  function pinMode(pin, mode) {
  var msg = {};
    msg.buffer = [PIN_MODE, pin, mode];
    mConnection.postMessage(msg);
    //addPackage(arrayBufferFromArray(msg.buffer), function(){});
  }
  
  function pinMode_init() {
  
  pinMode(2,OUTPUT);
  pinMode(4,OUTPUT);
  pinMode(3,PWM);
  
  pinMode(7,OUTPUT);
  pinMode(8,OUTPUT);
  pinMode(5,PWM);
  
  pinMode(10,PWM);
  pinMode(9,PWM);
  pinMode(6,PWM);
  
  pinMode(16,OUTPUT);
  console.log("Pins initialized");
  }

  function digitalWrite(pin, val) {

    var portNum = (pin >> 3) & 0x0F;
    if (val == LOW) {
      digitalOutputData[portNum] &= ~(1 << (pin & 0x07));
      //console.log(digitalOutputData[portNum]);
      }
    else {
      digitalOutputData[portNum] |= (1 << (pin & 0x07));
      //console.log(digitalOutputData[portNum]);
      }
      
    	if (pinmode[pin] != 0) {  
    	pinMode(pin, OUTPUT);
    	}
    
    var msg = {}
    msg.buffer = [
        DIGITAL_MESSAGE | portNum,
        digitalOutputData[portNum] & 0x7F,
        digitalOutputData[portNum] >> 0x07];
     mConnection.postMessage(msg);
     
     //addPackage(arrayBufferFromArray(msg.buffer), function(){});
  }


  function analogWrite(pin, val) {

    if (val < 0) val = 0;
    else if (val > 100) val = 100;
    val = Math.round((val / 100) * 255);
    
    	if (pinmode[pin] != 1) {
    	pinMode(pin, PWM);
    	}
    
    var msg = {};
    msg.buffer =  [
        ANALOG_MESSAGE | (pin & 0x0F),
        val & 0x7F,
        val >> 7];
     mConnection.postMessage(msg);
     //addPackage(arrayBufferFromArray(msg.buffer), function(){});
    //console.log(msg);
  }
  
  


  ext.buzzer = function(stan) {
  
  
  if (stan == 'włączony'){
  	
  	digitalWrite(16,HIGH);
  	}
  	else {
  	digitalWrite(16,LOW);
  	}
  
  }

  ext.setOUTPUTdigital = function(output, value) {
  
	var val = value;
	
	if (value == 'włączony')
		val = 1;
	if (value == 'wyłączony')
		val = 0;

    if (output == 'OUTPUT 1') {
   	digitalWrite(10, val);
    }
       if (output == 'OUTPUT 2') {
    digitalWrite(9, val);
    }
       if (output == 'OUTPUT 3') {
    digitalWrite(6, val);
    }
       if (output == 'OUTPUT 4') {
    digitalWrite(5, val);
    }
  
  }
  
  
    ext.setOUTPUT = function(output, value) {
  

     if (output == 'OUTPUT 1') {
   	analogWrite(10, value);
    }
       if (output == 'OUTPUT 2') {
    analogWrite(9, value);
    }
       if (output == 'OUTPUT 3') {
    analogWrite(6, value);
    }
       if (output == 'OUTPUT 4') {
    analogWrite(5, value);
    }
  
  }
  
    ext.silnik = function(motor, direction, speed) {

	if (motor == 'M1') {
		if (direction == 'przód') {
		//console.log("M");
     		digitalWrite(2, HIGH);
      		digitalWrite(4, LOW);
      		analogWrite(3, speed);
      	}		
      	if (direction == 'tył') {
     		digitalWrite(2, LOW);
      		digitalWrite(4, HIGH);
      		analogWrite(3, speed);
      	}
      	
    }
    
    if (motor == 'M2') {
		if (direction == 'przód') {
     		digitalWrite(7, HIGH);
      		digitalWrite(8, LOW);
      		analogWrite(5, speed);
      	}		
      	if (direction == 'tył') {
     		digitalWrite(7, LOW);
      		digitalWrite(8, HIGH);
      		analogWrite(5, speed);
      	}
     }
 
  };


  function rotateServo(pin, deg) {
   
    pinMode(pin, SERVO);
    var msg = {};
    msg.buffer = [
        ANALOG_MESSAGE | (pin & 0x0F),
        deg & 0x7F,
        deg >> 0x07];
    device.send(msg);
  }

  ext.serwo = function(servo, deg) {
	if (deg < 0) deg = 0;
    else if (deg > 180) deg = 180;
   
   if (servo == 'OUTPUT 1') {
    rotateServo(10, deg);
    }
       if (servo == 'OUTPUT 2') {
    rotateServo(9, deg);
    }
       if (servo == 'OUTPUT 3') {
    rotateServo(6, deg);
    }
       if (servo == 'OUTPUT 4') {
    rotateServo(5, deg);
    }
    
  };
  
  
    function analogRead(pin) {
    if (pin >= 0 && pin < pinModes[ANALOG].length) {
      return Math.round((analogInputData[pin] * 100) / 1023);
    }
  }
  
  
  function messageParser2(buf) {
	  
	  var msg = {};
	  
	  if (buf[0]==240) {
		msg1 = buf;  
	  }
	  else {
		  msg2 = buf;
	  }
	  
	  msg.buffer = msg1.concat(msg2);
	  
	  if (msg.buffer.length == 4) {
	  
	  dist_read = msg.buffer[2] ;
	  }
	  
	  if (dist_read == 0) {
		  dist_read = 1000;
	  }
	  
	  	  
	  }
  
  
  function messageParser(buf) {
  
  var msg = {};
  
  if (buf[0]==227){
  msg1 = buf;
  }
  else if (buf[0] != 240) {
  msg2 = buf;
  }
  
  
  msg.buffer = msg1.concat(msg2);
  
  if (msg.buffer.length > 12) {
	  msg.buffer = msg.buffer.slice(0,12);
	  //console.log("H");
	  //console.log(msg.buffer);
  }
 
  
  if (msg.buffer.length == 12){


	  
	  var i;
	  for (i = 0; i < 10; i = i+3) {
	
	
		   if (msg.buffer[i] == 224) {
		   analogRead0 = Math.round((msg.buffer[i+1]   + 128*msg.buffer[i+2]) * 100 / 1023);
  		   }		   
  		   if (msg.buffer[i] == 225) {
	  	   analogRead1 = Math.round((msg.buffer[i+1]   + 128*msg.buffer[i+2]) * 100 / 1023);  
  		   }
  		   if (msg.buffer[i] == 226) {
	  	   analogRead2 = Math.round((msg.buffer[i+1]   + 128*msg.buffer[i+2]) * 100 / 1023);   
  		   }
  		   if (msg.buffer[i] == 227) {
	  	   analogRead3 = Math.round((msg.buffer[i+1]   + 128*msg.buffer[i+2]) * 100 / 1023); 
  		   }
		  
	  } 
	  
	  //console.log(analogRead0);
  }
  
  
  
  /*
  if (buf[0] == 227 && buf.length == 12) {
  //analogRead0 = buf[1]   + 128*buf[2]; 
  analogRead0 = Math.round((buf[1]   + 128*buf[2]) * 100 / 1023);
  //msg.buffer = [0xC0, 0];
  //analog1enable = false;
  //console.log("hi");
  //console.log(buf);
  }
  
    if (buf[3] == 226 && buf.length == 12) {
  //analogRead1 = buf[4] + 128*buf[5];
  analogRead1 = Math.round((buf[4]   + 128*buf[5]) * 100 / 1023);
  //msg.buffer = [0xC1, 0];
  }
    
    if (buf[6] == 225 && buf.length == 12) {
  //analogRead2 = buf[7] + 128*buf[8];
  analogRead2 = Math.round((buf[7]   + 128*buf[8]) * 100 / 1023);
  //msg.buffer = [0xC2, 0];
  }
    
    if (buf[9] == 224 && buf.length == 12) {
  analogRead3 = buf[10] + 128*buf[11];
  analogRead3 = Math.round((buf[10]   + 128*buf[11]) * 100 / 1023);
  //msg.buffer = [0xC3, 0];
  }
  */
  
  }
  
    ext.readINPUTanalog = function(input) {
  
    var reading = 0;
    var msg = {};
    
    	if (analog0enable == false){
        msg.buffer = [0xC0, 1];
    	mConnection.postMessage(msg);
    	msg.buffer = [0xC1, 1];
    	mConnection.postMessage(msg);
    	msg.buffer = [0xC2, 1];
    	mConnection.postMessage(msg);
    	msg.buffer = [0xC3, 1];
    	mConnection.postMessage(msg);
    	analog0enable = true;
    	}
    	
    
    if (input == 'INPUT 1'){
    reading = analogRead0;
    }
    
    if (input == 'INPUT 2'){
    reading = analogRead1;
    }
    
    if (input == 'INPUT 3'){
    reading = analogRead2;
    }
    
    if (input == 'INPUT 4'){
    reading = analogRead3;
    }
    
    
    

    return reading;
  
  }


  ext.readUltrasound = function(input) {
  
    //var msg = new Uint8Array([0xF0,0x08,14,0xF7]);
    //device.send(msg.buffer);
    
    var msg = {};
    msg.buffer = [0xF0,0x08,14,0xF7];
    //240 8 14 247  
   
    mConnection.postMessage(msg);
    
  	var distance = dist_read;
  	if (distance == 0) {
  	distance = 1000;
  	}
      	//console.log(storedInputData[i]);
    //console.log(distance);
    
    //this.arduino.board.sp.write(new Buffer([0xF0, 0x08, pinNumber, 0xF7])
  
  return distance;
  
  }



///////////mblock buffer

	var _buffers = [];
	var _isWaiting = false;
	
	
	function addPackage(buffer,callback){
		_buffers.push(buffer);
		var extId = buffer[4];
		setTimeout(function(){
			callback(_selectors["value_"+extId]);
		},100);
		writePackage();
	}
	function writePackage(){
		if(_buffers.length>0&&_isWaiting==false){
			_isWaiting = true;
			var buffer = _buffers[0];
			_buffers.shift();
			var msg = {};
			msg.buffer = buffer;
			mConnection.postMessage(msg);
			setTimeout(function(){
					_isWaiting = false;
					writePackage();
				},20); 
		}
	}
	var arrayBufferFromArray = function(data){
        var result = new Int8Array(data.length);
        for(var i=0;i<data.length;i++){
            result[i] = data[i];
        }
        return data;
    }


	
	var descriptor = {
	
	url: 'http://www.lofirobot.com',
	
        blocks: [
			[' ', 'obracaj silnik %m.silnik w  kierunku %m.kierunek z mocą %n', 'silnik', 'M1','przód', 100],
			[' ', 'ustaw wyjście %m.output na wartość  %n%', 'setOUTPUT', 'OUTPUT 1', 100],
			[' ', 'ustaw wyjście %m.output jako  %m.stan', 'setOUTPUTdigital', 'OUTPUT 1', 'włączony'],
			//[' ', 'ustaw serwo na wyjściu %m.output na pozycję %n', 'serwo', 'OUTPUT 1', 180],
			[' ', 'ustaw BUZZER jako %m.stan', 'buzzer', 'włączony'],
			['r', 'czujnik odległości', 'readUltrasound', 'INPUT 1'],
			['r', 'odczytaj wejście %m.input', 'readINPUTanalog', 'INPUT 1']
			
			],
        menus: {

      silnik: ['M1','M2'],
      kierunek: ['przód', 'tył'],
      input: ['INPUT 1','INPUT 2','INPUT 3','INPUT 4'],
      output: ['OUTPUT 1','OUTPUT 2', 'OUTPUT 3', 'OUTPUT 4'],
      stan: ['włączony', 'wyłączony']
		}
    };


	ext._getStatus = function() {
        return {status: mStatus, msg: mStatus==2?'Ready':'Not Ready'};
    };
	ext._shutdown = function() {
	    if(poller) poller = clearInterval(poller);
	    status = false;
	}
    function getAppStatus() {
        chrome.runtime.sendMessage(LOFI_ID, {message: "STATUS"}, function (response) {
            if (response === undefined) { //Chrome app not found
                console.log("Chrome app not found");
                mStatus = 0;
                setTimeout(getAppStatus, 1000);
            }
            else if (response.status === false) { //Chrome app says not connected
                mStatus = 1;
                setTimeout(getAppStatus, 1000);
            }
            else {// successfully connected
                if (mStatus !==2) {
                    console.log("Connected");
                    mConnection = chrome.runtime.connect(LOFI_ID);
                    mConnection.onMessage.addListener(onMsgApp);
                    
                    pinMode_init();
                }
                mStatus = 2;
                setTimeout(getAppStatus, 1000);
            }
        });
    };
    
    
    function onMsgApp(msg) {
		var buffer = msg.buffer;
		//console.log(buffer);
		
		
		if (buffer[0]==227 || buffer[0]==224){
		messageParser(buffer);
		last_reading = 0;
		}
		
		//if ( a in { "apple": "", "banana": "" } ) { ... }
		if (buffer[0] != 227 && buffer[0] != 224) {
			if ( buffer[0] != 240 && last_reading == 0){
		    messageParser(buffer);	
		    last_reading = 3;
		    }
		}
		
		if (buffer[0]==240 && buffer.length<3){
		messageParser2(buffer);
		last_reading = 1;
		//console.log("m1");
		//console.log(buffer);
		}
		
		if (buffer[0] != 227 && buffer[0] != 224 ) {
			if (buffer[0] != 240 && last_reading == 1){
				if (buffer.length < 4){
					//console.log("m2");
				messageParser2(buffer);	
				//console.log(buffer);
				last_reading = 3;	
				}
		    }
		}
    
        
    };
    getAppStatus();
    
    
    
	ScratchExtensions.register('LOFI Robot Ultra', descriptor, ext);
})({});

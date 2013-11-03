rc
==

remote console

install
--
    git clone https://github.com/mucbuc/rc.git  
    cd rc  
    npm install  
    node app.js  

basic authentication
--
set 'username' and 'password' values in rc/config.json

sandboxing
--
* enable commands by adding to the 'sandbox' array in rc/config.json  
* enable file uplad by setting 'upload' true in config.json  

macro substitution
--
1. add macros key/values inside macros.json  
2. restart server  
3. type the key word and press right arrow  

shortcuts 
--
* Tab       => auto complete similar to console on Windows  
* Up/Down   => traverse command history  
* Back/Forward (browser) => traverse path history
* Ctrl+c    => kill current process

file upload
--
* enable file uplad by setting 'upload' true in config.json  
* the file will be uploaded to the current working directory   

todo
--
* pipe  
* encryption  
* persistence  




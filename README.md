rc
==

remote console using node.js

install
--
    git clone https://github.com/mucbuc/rc.git  
    cd rc  
    npm install  
    node app.js  

connect
--

linux/mac  

    open http://localhost:3000  
    
Windows
  
    start http://localhost:3000  

basic authentication
--
set 'username' and 'password' values in rc/config.json

sandboxing
--
enable commands by adding to the 'sandbox' array in rc/config.json  
enable file upload by setting 'upload' true in config.json  

macro substitution
--
1. add macro key/values inside macros.json  
2. restart server if running
3. type the key word and press right arrow  

shortcuts 
--
Tab       => auto complete similar to console on Windows  
Up/Down   => traverse command history  
Back/Forward (browser) => traverse path history  
Ctrl+c    => kill current process

file upload
--
the file will be uploaded to the current working directory   
enable file upload by setting 'upload' true in config.json  

todo
--
* pipe  
* encryption  
* persistence  




const { Str } = require('@supercharge/strings');
const express = require('express');
const app = express();
const http = require('http');
const { event } = require('jquery');
const server = http.createServer(app);
const { Server } = require("socket.io");
const sifu = require('socketio-file-upload');
const io = new Server(server);

app.use(sifu.router).use(express.static(__dirname));

/// socket.io
var users =[];
io.on('connection', socket=>{
    //console.log(socket.id);
    //file upload
    var uploader = new sifu();
    uploader.dir ='./Uploads';
    uploader.listen(socket);
    //
    socket.emit('connectionsuccess', 'join with a username')
    socket.on('addme', name=>{
        socket.username = name;
        users.push({id:socket.id, username:name});
        console.log(users);
        io.emit('userlist', users)
    });
    socket.on('send', msg=>{
        //console.log('send')
        //console.log(socket.id);
       // console.log(msg);
        var u = users.find(x=> x.id == socket.id)
        //console.log(u);
        io.emit('message',{from : u.username, msg: msg});
    });
    socket.on('share', data=>{
        console.log(data)
        var u = users.find(x=> x.id == socket.id)
        io.to(data.to).emit('privateshare', data, u.username);
    });
    uploader.on('start', event=>{
        var f = event.file.name;
        var arr = f.split('.');
        var newname = Str.random(10)+'.' + arr[arr.length-1];
        console.log(f);
        console.log(newname);
        return event.file.name = newname;
    });
    uploader.on("saved", function(event){
        var u = users.find(x=> x.id == socket.id)
        var arr = event.file.name.split('.');
        var t='';
        if(['png', 'jpg', 'jpeg', 'gif', 'svg'].indexOf(arr[arr.length - 1])>=0) {
			t='image';
		}
		else{
			t='file';
		}
		io.emit('uploaded', {from: u.username, file:event.file.name, type:t});
    });
    uploader.on("error", function(event){
        console.log("Error from loader", event);
    });
});
///
server.listen(8012, () => {
    console.log('listening on:8012');
  });
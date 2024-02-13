const socket=io();

var username;

var chats=document.querySelector(".chats");
var users_list=document.querySelector(".users-list");
var users_count=document.querySelector(".user-count");
var msg_send=document.querySelector("#user-send");
var user_msg=document.querySelector("#user-msg");



do{
    username=prompt("Enter your name:");
}while(!username); 

socket.emit("new-user-joined",username);

socket.on('user-connected',(socket_neme)=>{
    userjoinLeft(socket_neme,'joined');
});

function userjoinLeft(name,status){
    let div=document.createElement("div");
    div.classList.add('user-join');
    let content=`<p><b>${name}</b>${status} the chat</p>`;
    div.innerHTML=content;
    chats.appendChild(div);
    chats.scrollTop=chats.scrollHeight;


}

socket.on('user-disconnected',(user)=>{
    userjoinLeft(user,'left');
}); 



socket.on('user-list',(users)=>{
    users_list.innerHTML="";
    users_arr=Object.values(users);
    for(i=0;i<users_arr.length;i++){
        let p=document.createElement('p');
        p.innerText=users_arr[i];
        users_list.appendChild(p);

    }
    users_count.innerHTML=users_arr.length;
})


//msg
msg_send.addEventListener('click',()=>{
    let data={
        user:username,
        msg:user_msg.value
    };

    if(user_msg.value!=''){
        appenMessage(data,'outgoing');
        socket.emit('message',data);
        user_msg.value='';
    }
});

function appenMessage(data,status){
     let div=document.createElement('div');
     div.classList.add('message',status);
     let content=`
     <h5>${data.user}</h5>
     <p>${data.msg}</p>
     `;
     div.innerHTML=content;
     chats.appendChild(div);
     chats.scrollTop=chats.scrollHeight;
}

socket.on('message',(data)=>{
    appenMessage(data,'incoming');
})

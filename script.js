const titles = [
"Network Engineer",
"MikroTik Specialist",
"Cisco Networking",
"Network Security",
"Python Automation"
];

let i = 0;

const title = document.querySelector(".hero-text h2");

setInterval(()=>{
title.innerHTML=titles[i];
i++;
if(i>=titles.length){
i=0;
}
},2000);
// Back To Top Button

const mybutton = document.getElementById("topBtn");

window.onscroll = function () {

    if(document.body.scrollTop > 300 || document.documentElement.scrollTop > 300){

        mybutton.style.display="block";

    }else{

        mybutton.style.display="none";

    }

};

function topFunction(){

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}
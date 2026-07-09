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


/*==========================
NETWORK LAB
==========================*/

/* Gallery */

const galleryBtn = document.querySelector(".seeGalleryBtn");
const galleryItems = document.querySelectorAll(".extra-gallery");

let galleryOpen = false;

galleryBtn.addEventListener("click", function(){

    galleryOpen = !galleryOpen;

    galleryItems.forEach(item=>{
        item.style.display = galleryOpen ? "block" : "none";
    });

    galleryBtn.innerHTML = galleryOpen
        ? "Show Less Images"
        : "See All Images";

});


/* Videos */

const videoBtn = document.querySelector(".seeVideoBtn");
const videoItems = document.querySelectorAll(".extra-video");

let videoOpen = false;

videoBtn.addEventListener("click", function(){

    videoOpen = !videoOpen;

    videoItems.forEach(item=>{
        item.style.display = videoOpen ? "block" : "none";
    });

    videoBtn.innerHTML = videoOpen
        ? "Show Less Videos"
        : "See All Videos";

});
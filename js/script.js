const BACKEND = "https://nexora-dashboard-klgw.onrender.com";

const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");
const cursorGlow = document.querySelector(".cursor-glow");

const loadingMessages = [
  "Initializing RUDRA...",
  "Loading Security Modules...",
  "Connecting Discord...",
  "Connecting Database...",
  "Checking Bot Status...",
  "Preparing Dashboard..."
];

let i = 0;

setInterval(() => {
  if (loaderText) {
    loaderText.textContent = loadingMessages[i];
    i = (i + 1) % loadingMessages.length;
  }
}, 650);

window.addEventListener("load", () => {

  setTimeout(() => {

    loader.style.opacity = "0";
    loader.style.pointerEvents = "none";

    setTimeout(() => {
      loader.style.display = "none";
    }, 500);

  }, 3500);

});

document.addEventListener("mousemove", e => {

  if (!cursorGlow) return;

  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";

});

async function updateStatus(){

  const status = document.querySelector(".status b");
  const dot = document.querySelector(".dot");

  if(!status) return;

  try{

    const res = await fetch(`${BACKEND}/health`);

    const data = await res.json();

    if(data.status==="Online"){

      status.textContent="ONLINE";

      status.style.color="#00ff88";

      dot.style.background="#00ff88";

      dot.style.boxShadow="0 0 18px #00ff88";

    }else{

      status.textContent="OFFLINE";

      status.style.color="#ff3333";

      dot.style.background="#ff3333";

      dot.style.boxShadow="0 0 18px #ff3333";

    }

  }catch{

      status.textContent="OFFLINE";

      status.style.color="#ff3333";

  }

}

updateStatus();

setInterval(updateStatus,10000);

async function checkLogin(){

  try{

    const res=await fetch(`${BACKEND}/api/user`,{

      credentials:"include"

    });

    if(!res.ok) return;

    const user=await res.json();

    if(user.loggedIn){

      window.location.href=`${BACKEND}/dashboard/dashboard.html`;

    }

  }catch{}

}

setTimeout(checkLogin,4200);

document.addEventListener("keydown",e=>{

  if(e.key==="Enter"){

    window.location.href=`${BACKEND}/auth/discord`;

  }

});

document.querySelector(".login-btn")?.addEventListener("mouseenter",()=>{

  navigator.vibrate?.(15);

});

console.log("✅ RUDRA Login Ready");
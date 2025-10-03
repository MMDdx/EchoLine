(()=>{let e=document.getElementById("tab-signin"),t=document.getElementById("tab-signup"),s=document.getElementById("form-signin"),i=document.getElementById("form-signup"),n=document.getElementById("signin-submit"),o=document.getElementById("signup-submit"),a=document.querySelector(".auth-container"),r=e=>{sessionStorage.setItem("AccessToken",e.data.AccessToken)};function c(e,t="success"){let s=a.querySelector(".notification");s&&s.remove();let i=`
        <div class="notification ${t}">
            <div class="icon"></div>
            <div class="message">${e}</div>
            <div class="timer-ring">
                <svg>
                    <rect x="1" y="1" rx="8" ry="8"></rect>
                </svg>
            </div>
        </div>
    `;a.insertAdjacentHTML("beforeend",i);let n=a.querySelector(".notification"),o=n.querySelector(".timer-ring rect"),{width:r,height:l}=n.getBoundingClientRect();o.setAttribute("width",r-2),o.setAttribute("height",l-2);let d=2*(r+l-4);o.setAttribute("stroke-dasharray",d),o.setAttribute("stroke-dashoffset",d),setTimeout(()=>{n.style.opacity="0",setTimeout(()=>n.remove(),300)},3e3)}e.addEventListener("click",function(){e.classList.add("active"),t.classList.remove("active"),s.style.display="",i.style.display="none"}),t.addEventListener("click",function(){t.classList.add("active"),e.classList.remove("active"),i.style.display="",s.style.display="none"}),o.onclick=async e=>{e.preventDefault();let t=document.querySelector("#signup-email").value,s=document.querySelector("#signup-password").value,i=document.querySelector("#signup-confirmPassword").value,n=document.querySelector("#signup-username").value,o=await fetch("/api/v1/users/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:s,confirmPassword:i,username:n})}),a=await o.json();o.ok?(r(a),c("logged in!"),location.href="/home"):c(a.message,"error")},n.onclick=async e=>{e.preventDefault();let t=document.querySelector("#signin-password").value,s=document.querySelector("#signin-username").value,i=await fetch("/api/v1/users/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:t,username:s})}),n=await i.json();i.ok?(r(n),c("logged in!","success"),location.href="/home"):c(n.message,"error")}})();
//# sourceMappingURL=login.js.map

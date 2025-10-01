const tabSignin = document.getElementById('tab-signin');
const tabSignup = document.getElementById('tab-signup');
const formSignin = document.getElementById('form-signin');
const formSignup = document.getElementById('form-signup');
const signin_submit = document.getElementById("signin-submit");
const signup_submit = document.getElementById("signup-submit");
const authContainer = document.querySelector('.auth-container');

function showSignin() {
    tabSignin.classList.add('active');
    tabSignup.classList.remove('active');
    formSignin.style.display = '';
    formSignup.style.display = 'none';
}
function showSignup() {
    tabSignup.classList.add('active');
    tabSignin.classList.remove('active');
    formSignup.style.display = '';
    formSignin.style.display = 'none';
}

const setAccessToken = (body) => {
    sessionStorage.setItem('AccessToken', body.data.AccessToken);
}

tabSignin.addEventListener('click', showSignin);
tabSignup.addEventListener('click', showSignup);

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = authContainer.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification HTML
    const notificationHTML = `
        <div class="notification ${type}">
            <div class="icon"></div>
            <div class="message">${message}</div>
            <div class="timer-ring">
                <svg>
                    <rect x="1" y="1" rx="8" ry="8"></rect>
                </svg>
            </div>
        </div>
    `;
    authContainer.insertAdjacentHTML('beforeend', notificationHTML);

    // Set SVG rect dimensions and stroke properties dynamically
    const notification = authContainer.querySelector('.notification');
    const rect = notification.querySelector('.timer-ring rect');
    const { width, height } = notification.getBoundingClientRect();
    rect.setAttribute('width', width - 2); // Adjust for x=1
    rect.setAttribute('height', height - 2); // Adjust for y=1
    const perimeter = 2 * (width + height - 4); // Perimeter of rect
    rect.setAttribute('stroke-dasharray', perimeter);
    rect.setAttribute('stroke-dashoffset', perimeter);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300); // Wait for fade-out
    }, 3000);
}


signup_submit.onclick = async (e) =>{
    e.preventDefault();
    let email = document.querySelector("#signup-email").value
    let password = document.querySelector("#signup-password").value
    let confirmPassword = document.querySelector("#signup-confirmPassword").value
    let username = document.querySelector("#signup-username").value
    let res = await fetch("/api/v1/users/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json' // Tells server you're sending JSON
        },
        body:JSON.stringify({
            email,password,confirmPassword,username
        }),

    })
    let resJSON = await res.json()
    if (res.ok) {
        setAccessToken(resJSON);
        showNotification("logged in!")
        location.href = '/home';

    }
    else {
        console.log(resJSON)
        showNotification(resJSON.message, "error");
    }

    console.log(res)
}
signin_submit.onclick = async (e) =>{
    e.preventDefault();
    let password = document.querySelector("#signin-password").value
    let username = document.querySelector("#signin-username").value
    let res = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({
            password,username
        }),

    })
    let resJSON = await res.json()
    if (res.ok) {
        setAccessToken(resJSON);
        showNotification("logged in!", 'success')
        location.href = '/home';
    }
    else {
        showNotification(resJSON.message, "error");
    }
}
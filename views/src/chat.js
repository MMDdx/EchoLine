import {socket} from "./socket";
import axios from "axios";

Object.assign(userCache, window.userCache || {});
Object.assign(seenBys, window.seenBys || {});

let pendingChatUser = null;

let chat_inp = document.getElementById("message");
let send_chat = document.getElementById("send-message");
const chatContainer = document.querySelector("#chat-container");
const searchInput = document.getElementById('user-search');
const chatList = document.querySelector('#chat-list');
const searchResults = document.getElementById("search-results");
const statusEl = document.querySelector(".user-status");
const searchBarContainer = document.querySelector(".search-bar-container");
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');
const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
const chatMain = document.querySelector(".chat-main")

import {initGroupCreation}  from "./group.js"
import {initProfileModal} from "./profile";
import {initSeenObserver} from "./seen";
import {refreshToken} from "./refreshTok";

let myUsername;
let currentId;
let currentConvId;
let talkingTo;
let welcome_message;
let token;
let currentElInfo;

const getAccessToken = () => {
    return  sessionStorage.getItem('AccessToken');
}


token = getAccessToken();
if (token){
    axios.defaults.headers.common['authorization'] = `Bearer ${token}`;
}else {
    showNotification("Please log in again", 'error');
    location.replace("/")
}


socket.on('chat message', (data) => {
    insertMessage(data);
    welcome_message.remove();
})

socket.on("new conversation", renderOrUpdateChatItem);

socket.on("new message", renderOrUpdateChatItem);

socket.on("change status", changeUserStatus)

socket.on("user seen update", ({ conversationId, userId, messageId }) => {

    if (!seenBys[conversationId]){
        seenBys[conversationId] = {}
    }
    seenBys[conversationId][userId] = messageId;

    // 1) Ignore updates *you* triggered
    if (userId === currentId) return;

    // 2) Now mark **all** your outgoing messages up to messageId as read
    const outgoing = Array.from(document.querySelectorAll('.message.you'));
    for (const msgEl of outgoing) {
        const receipt = msgEl.querySelector('.receipt-icon');
        if (!receipt) continue;

        // Only mark those not already read
        if (!receipt.classList.contains('read')) {
            receipt.classList.add('read');
        }

        if (msgEl.dataset.messageId === messageId) break;
    }
});

socket.on("connect_error", async (err) => {
    console.warn("Socket connection failed:", err.message);
    if (err.message.includes("jwt expired")) {

        try {
            const newAccessToken = await refreshToken(); // your logic
            socket.auth.token = `Bearer ${newAccessToken}`;
            socket.connect(); // retry connection with fresh token
        } catch (refreshErr) {
            console.error("Auth Expired!", refreshErr);
            showNotification(refreshErr, "error");
        }
    }
});

const sendChatFunc = async ()=> {
    if (!chat_inp.value) return ;

    let messageArgs = {
        text:chat_inp.value,
        user: currentId,
        conversation: currentConvId,
        sender: currentId
    }

    if (!currentConvId){
        if (pendingChatUser.userId) {
            messageArgs.myUsername = myUsername;
            let newConv;
            try{
                newConv = await axios.post("/api/v1/conversations", {
                    members: [pendingChatUser.userId, currentId],
                    lastMessage: messageArgs
                })
            }catch (e){
                token = await refreshToken()
                newConv = await axios.post("/api/v1/conversations", {
                    members: [pendingChatUser.userId, currentId],
                    lastMessage: messageArgs
                })
            }
            socket.emit("join room", newConv.data.data)
            currentConvId = newConv.data.data;
            messageArgs.conversation = currentConvId;
        }
        else return showNotification("something went Wrong! please refresh the page!", "error");
    }
    socket.emit("chat message", messageArgs);
    chat_inp.value = "";
    welcome_message.remove()
}
const sendMessageOnEnter =  (e) => {
    if (e.key === "Enter") return send_chat.click();
}


const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getUserInfo = async (id) => {
    let res;
    try{
        res = await axios.get(`/api/v1/users/search/${id}`);
    }
    catch (e){
        token = await refreshToken()
        return await getUserInfo(id)
    }
    if (res.data.data) userCache[id] = res.data.data;
    return res.data.data;
}


const insertMessage = async ({ senderId, text, timestamp, _id }) => {
    // 1) Lookup user info
    let user = userCache[senderId];
    if (!user) user = await getUserInfo(senderId);

    // 2) Create the outer message div
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    if (senderId === currentId) messageDiv.classList.add("you");
    messageDiv.dataset.messageId = _id;
    messageDiv.dataset.timestamp = new Date(timestamp).getTime();
    // 3) Avatar
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");
    const avatarImg = document.createElement("img");
    avatarImg.src = user?.avatar
        ? `/img/users/${user.avatar}`
        : "/img/users/default.jpg";
    avatarImg.alt = `${user.username}'s avatar`;
    avatarImg.classList.add("avatar-img");
    avatarDiv.appendChild(avatarImg);

    // 4) Content container
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");

    // 4a) Header
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("message-header");
    const usernameSpan = document.createElement("span");
    usernameSpan.classList.add("message-username");
    usernameSpan.textContent =
        senderId === currentId ? "You" : user.username;
    const timeSpan = document.createElement("span");
    timeSpan.classList.add("message-time");
    timeSpan.textContent = formatTime(timestamp);
    headerDiv.append(usernameSpan, timeSpan);

    // 4b) Text
    const messageText = document.createElement("div");
    messageText.classList.add("message-text");
    messageText.textContent = text;

    // 4c) Meta (receipt container)
    const metaDiv = document.createElement("div");
    metaDiv.classList.add("message-meta");

    // Only for your own messages, add the receipt-icon placeholder
    if (senderId === currentId) {
        const receiptSpan = document.createElement("span");
        receiptSpan.classList.add("receipt-icon");
        receiptSpan.dataset.messageId = _id;
        metaDiv.appendChild(receiptSpan);
    }

    // 5) Assemble
    contentDiv.append(headerDiv, messageText, metaDiv);
    messageDiv.append(avatarDiv, contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
};

const insertAnoncement = (message, typ) => {
    const chatContainer = document.querySelector("#chat-container");
    let div = document.createElement("div");
    div.classList.add(typ);
    div.textContent = message;
    div.innerHTML = `<img src="/icons/welcome-to-chat.png" alt="Chat Icon" class="welcome-icon">${message}`
    chatContainer.appendChild(div);
    return div
}


const getAllChatItems = () => {
    return document.querySelectorAll(".chat-item");
}

const checkDuplicateChat = (username) => {
    const allChats = document.querySelectorAll(".chat-name");
    let res = false;

    allChats.forEach(el => {
        if (el.textContent === username.trim()) {

            el.parentElement.click();
            return res = true;
        }
    })
    return res;
}

function changeUserStatus(data){
    if (data.status) {
        statusEl.classList.remove("offline")
        statusEl.textContent = "Online"
    }
    else {
        statusEl.classList.add("offline")
        statusEl.textContent = "Offline"
    }
}

async function renderOrUpdateChatItem(conversation) {
    if (!conversation || !conversation._id) return;

    const { _id: convId, isGroup, avatar, members, lastMessage } = conversation;
    const chatList = document.getElementById("chat-list");
    const selector = `.chat-item[data-convID="${convId}"]`;
    let item = chatList.querySelector(selector);
    let userInfo;
    // Compute display values
    let convName, avatarUrl, senderName, messageText;
    if (isGroup) {
        convName = conversation.name;
        avatarUrl = `/img/groups/${avatar || "default-group.jpg"}`;
    } else {
        // figure out the “other” user ID
        const otherId = members.find(id => id !== currentId);
        userInfo = userCache[otherId] || await getUserInfo(otherId);
        convName = userInfo.username || "Unknown";
        avatarUrl = `/img/users/${userInfo.avatar || "default-user.jpeg"}`;
        // also stash data-username for click handler
        // (if you need it elsewhere)
    }

    if (lastMessage) {

        const lastSender = userCache[lastMessage.sender] || {};

        senderName = lastSender.username === myUsername ? "You" : lastSender.username;
        const txt = lastMessage.text || "";
        messageText = txt.length > 30 ? txt.slice(0, 30) + "…" : txt;
    } else {
        senderName = "";
        messageText = "No messages yet";
    }

    if (item) {
        // — PATCH EXISTING DOM NODE —

        // 1) Avatar
        const img = item.querySelector(".chat-avatar");
        if (img) img.src = avatarUrl;

        // 2) Conversation name
        const nameEl = item.querySelector(".chat-name");
        if (nameEl) nameEl.textContent = convName;

        // 3) Last‐message block
        let lastEl = item.querySelector(".chat-last-message");
        if (!lastEl) {
            // if it didn't exist before (rare), create it
            lastEl = document.createElement("div");
            lastEl.classList.add("chat-last-message");
            item.querySelector(".chat-info").appendChild(lastEl);
        }
        lastEl.innerHTML = lastMessage
            ? `<span class="sender">${senderName}:</span>
         <span class="text">${messageText}</span>`
            : "No messages yet";

        // 4) Move it to the top
        chatList.removeChild(item);
        chatList.insertBefore(item, chatList.firstChild);

    } else {
        // — CREATE NEW NODE —

        const usernameAttr = !isGroup
            ? `data-username="${convName}"`
            : "";
        let selected = "";
        if (lastMessage.sender === currentId) selected = 'selected'
        const html = `
        <div class="chat-item ${selected}" data-convID="${convId}" ${usernameAttr}>
        <img class="chat-avatar" src="${avatarUrl}" alt="Avatar">
        <div class="chat-info">
          <div class="chat-name">${convName}</div>
          <div class="chat-last-message">
            ${lastMessage
            ? `<span class="sender">${senderName}:</span>
                   <span class="text">${messageText}</span>`
            : "No messages yet"
        }
          </div>
        </div>
      </div>
    `.trim();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        item = wrapper.firstChild;
        OnClickChatItem(item);
        chatList.insertBefore(item, chatList.firstChild);
        seenBys[convId] = {}
        chatItems = getAllChatItems();
    }
    if (lastMessage.sender !== currentId) markConversationUnread(item);
}

const setInputVars = () => {
    chat_inp = document.getElementById("message");
    send_chat = document.getElementById("send-message");
}

const AddInputArea = () => {
    if (!document.querySelector("#message")){
        chatMain.insertAdjacentHTML('beforeend', ` <div class="input-area">
                    <input type="text" placeholder="Type your message..." id="message" autocomplete="off" />
                    <button id="send-message">Send</button>
                    </div>`)
        setInputVars()
        send_chat.onclick = sendChatFunc;
        chat_inp.onkeyup = sendMessageOnEnter;
    } else {
        chat_inp.value = "";
    }

}


function addInfoBar(item) {
    // Remove existing info bar
    const existingInfoBar = chatContainer.querySelector('.chat-info-bar');
    if (existingInfoBar) {
        existingInfoBar.remove();
    }

    // Get chat details
    const isGroup = !item.dataset.username; // If no username, it's a group
    const name = isGroup ? item.querySelector('.chat-name').textContent : item.dataset.username;
    const avatarSrc = item.querySelector('.chat-avatar').src;
    const status = isGroup ? 'Group' : ''; // Adjust status logic as needed

    currentElInfo = item
    // Create info bar HTML
    const infoBarHTML = `
        <div class="chat-info-bar">
            <img class="avatar" src="${avatarSrc}" alt="${name} Avatar" />
            <div class="name">${name}</div>
            <div class="status">${status}</div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('afterbegin', infoBarHTML);
}

function removeInfoBar() {
    const infoBar = chatContainer.querySelector('.chat-info-bar');
    if (infoBar) {
        infoBar.remove();
    }
}

const OnClickChatItem = function (el){
    el.onclick = async () => {
        if (currentConvId !== el.dataset.convid) {
            if (currentConvId) socket.emit("leave room", currentConvId);
            currentConvId = el.dataset.convid;
            clearConversationUnread(currentConvId)


            socket.emit("join room", currentConvId);
            chatContainer.innerHTML = "";
            chatContainer.dataset.convID = currentConvId;
            talkingTo = el.dataset.username;

            chatItems.forEach(i => i.classList.remove('selected'));
            el.classList.add('selected')

            initSeenObserver();
            AddInputArea();

            await fetchChats(currentConvId);
            if (chatContainer.classList.contains('sidebar-open')) currentElInfo = el;
            else addInfoBar(el);

        }
    }
};


const setOnClickOnSearchRes =  () => {
    const searchRes = document.querySelectorAll(".search-result-item")
    searchRes.forEach(el => {
        el.onclick = ()=> {

            const username = el.textContent;
            const userId = el.dataset.userid;

            if (username === talkingTo || checkDuplicateChat(username)) {
                searchInput.value = "";
                searchResults.innerHTML = "";
                return
            }
            socket.emit("leave room", currentConvId);
            currentConvId = undefined;
            talkingTo = username;
            // Store selected user temporarily
            pendingChatUser = { userId, username };
            chatContainer.innerHTML = "";
            // Clear chat UI and show welcome
            welcome_message.remove();
            welcome_message = insertAnoncement(`You can start a new chat with ${username}!`, 'welcome-message');
            // Optional: clear search box & results

            searchInput.value = "";
            searchResults.innerHTML = "";
            AddInputArea()

            chatItems.forEach(i => i.classList.remove('selected'));

        }
    })
}

searchInput.onfocus = () => {
    chatList.classList.add('blur');
}
searchInput.onblur = ()=>{
    chatList.classList.remove('blur')
    setTimeout(()=> {
        searchResults.innerHTML = "";
    }, 100)
}


searchInput.onkeyup = async () => {
    const query = searchInput.value.trim();

    if (query.length > 2) {
        try {
            let res;
            try{
                res = await axios.get(`/api/v1/users/search?query=${query}`);
            }catch (e){
                if(e.status === 401){
                    token = await refreshToken();
                    res = await axios.get(`/api/v1/users/search?query=${query}`);
                }
            }
            const users = res.data;

            if (users.length) {
                searchResults.innerHTML = users.map(user => `
                    <div class="search-result-item" data-userid="${user._id}">
                        <img class="search-avatar" src="/img/users/${user.avatar || 'default.jpg'}" alt="${user.username}'s avatar">
                        <span class="search-username">${user.username}</span>
                    </div>
                `).join("");

                setOnClickOnSearchRes();
            } else {
                searchResults.innerHTML = `<div class="search-result-item">No results found</div>`;
            }
        } catch (err) {
            console.error("Search error:", err);
            showNotification(err, "error");
        }
    } else {
        searchResults.innerHTML = "";
    }
};


function markSeenByOthers(conversationId, globalSeenMap = {}) {
    // 1) pick only the per‐conversation map
    const convSeenMap = globalSeenMap[conversationId] || {};
    if (!Object.keys(convSeenMap).length) return;

    // 2) grab your outgoing messages in DOM order
    const outgoing = Array.from(
        document.querySelectorAll('.message.you')
    );

    // 3) for each other user in this conversation…
    Object.entries(convSeenMap).forEach(([userId, lastSeenId]) => {
        if (userId === currentId) return; // never compare yourself

        // 4) walk the outgoing array until we hit the lastSeenId
        for (const msgEl of outgoing) {
            const mid = msgEl.dataset.messageId;
            const receipt = msgEl.querySelector('.receipt-icon');
            if (!receipt) continue;

            // mark every message up through the one they actually saw
            receipt.classList.add('read');

            // once we reach that exact message, stop this loop
            if (mid === lastSeenId) break;
        }
    });
}

function markConversationUnread(item) {
    if (!item.querySelector(".unread-badge")) {
        const badge = document.createElement("span");
        badge.classList.add("unread-badge");
        item.appendChild(badge);
    }
}

function clearConversationUnread(convId) {
    const item = document.querySelector(`.chat-item[data-convID="${convId}"]`);
    if (!item) return;
    const badge = item.querySelector(".unread-badge");
    if (badge) badge.remove();
}

const getUserbyUsername = (username) => {
    for (let userId in userCache){
        if(userCache[userId].username === username) return userCache[userId];
    }
    return null;
}
export function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = chatContainer.querySelector('.notification');
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
    chatContainer.insertAdjacentHTML('beforeend', notificationHTML);

    // Set SVG rect dimensions and stroke properties dynamically
    const notification = chatContainer.querySelector('.notification');
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


const fetchChats = async (convID) => {
    try {
        let res = await axios.get(`/api/v1/messages/${convID}`);
        const messages = res.data.messages
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const chatContainer = document.getElementById('chat-container');
        chatContainer.innerHTML = '';

        messages.forEach(msg => {
            insertMessage({
                text:      msg.text,
                senderId:  msg.user,
                timestamp: msg.timestamp,
                _id:       msg._id
            });
        });
        const lastSeenId = seenBys[convID][currentId];

        const allMsgEls = Array.from(chatContainer.querySelectorAll('.message'));
        let dividerInserted = false;

        if (lastSeenId && allMsgEls.length) {
            if (!allMsgEls.at(-1).classList.contains('you')) {

                const idx = allMsgEls.findIndex(el => el.dataset.messageId === lastSeenId);
                if (idx !== -1) {
                    for (let j = idx + 1; j < allMsgEls.length; j++) {
                        const nextEl   = allMsgEls[j];

                        if (!nextEl.classList.contains("you")) {
                            // create & insert divider
                            const divider = document.createElement('div');
                            divider.classList.add('new-messages-divider');
                            divider.textContent = 'New messages';

                            nextEl.before(divider);


                            // scroll so this new‐message marker is visible
                            const pad = 10;
                            chatContainer.scrollTop = nextEl.offsetTop - pad;
                            dividerInserted = true;
                            break;
                        }
                    }
                }
            }
            }


        // if no divider (either no lastSeen or no other‐user messages after it),
        // just scroll to bottom
        if (!dividerInserted) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // mark everything up to the latest as seen
        markSeenByOthers(convID,seenBys);

    } catch (err) {
        if (err.status === 401){
            token = await refreshToken();
            return fetchChats(convID);
        }
        else {
            showNotification(err, "error");
        }
        console.error('fetchChats error', err);
    }
};


document.addEventListener("DOMContentLoaded", () => {
    const me = currentId;

    document.querySelectorAll(".chat-item").forEach(item => {
        const convId = item.dataset.convid;

        const childEl = item.querySelector(".chat-last-message")
        const lastMsgId  = childEl.dataset.messageId;
        const senderId   = childEl.firstElementChild?.dataset.userId

        if (!lastMsgId) return;           // nothing to compare
        if (senderId === me) return;      // you sent it yourself, so it’s “read”

        const lastSeenForThisConv = seenBys[convId] && seenBys[convId][me];
        if (String(lastSeenForThisConv || "") !== String(lastMsgId)) {
            // Not yet seen → add badge
            if (!item.querySelector(".unread-badge")) {
                const badge = document.createElement("span");

                badge.classList.add("unread-badge");
                item.append(badge);
            }
        }
    });
});

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    chatContainer.classList.add('sidebar-open');
    sidebarToggle.classList.add('hidden')
    removeInfoBar()
});

const closeSidebar = () => {
    sidebar.classList.remove('open');
    chatContainer.classList.remove('sidebar-open');
    sidebarToggle.classList.remove('hidden');
    if (currentElInfo) addInfoBar(currentElInfo);
};


// executing...
welcome_message = insertAnoncement("Welcome To EchoLine!", "welcome-message");
currentId = document.querySelector('.chat-container').dataset.curid;
myUsername = document.querySelector('.chat-container').dataset.curusername;


sidebarClose.addEventListener('click', closeSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);

let chatItems = getAllChatItems();
chatItems.forEach(OnClickChatItem)

initGroupCreation();
initProfileModal();


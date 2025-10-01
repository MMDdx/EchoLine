
import axios from "axios";

export function initGroupCreation() {
    const openBtn = document.getElementById("open-group-modal");
    const modal = document.getElementById("group-modal");
    const userList = document.getElementById("group-user-list");
    const cancelBtn = document.getElementById("cancel-group-btn");
    const createBtn = document.getElementById("create-group-btn");
    const currentId = document.querySelector('.chat-container').dataset.curid;
    const groupDetailsModal = document.getElementById("group-details-modal");
    const groupNameInput = document.getElementById("group-name-input");
    const groupAvatarInput = document.getElementById("group-avatar-input");
    const avatarPreview = document.getElementById("avatar-preview");
    const finalCreateBtn = document.getElementById("final-create-group-btn");
    const cancelGroupDetailsBtn = document.getElementById("cancel-group-details-btn");

    let selectedUserIds = [];

    if (!openBtn || !modal || !userList || !cancelBtn || !createBtn) {
        console.warn("Group modal elements not found in DOM");
        return;
    }

    openBtn.addEventListener("click", () => {
        userList.innerHTML = "";

        const chatItems = document.querySelectorAll(".chat-item");

        const users = new Map();

        chatItems.forEach((el) => {
            const username = el.dataset.username;
            const userId = el.dataset.userid;

            if (username && userId && !users.has(userId)) {
                users.set(userId, username);

                const div = document.createElement("div");
                div.classList.add("group-user-item");
                div.dataset.userid = userId;
                div.textContent = username;

                div.addEventListener("click", () => {
                    div.classList.toggle("selected");
                });

                userList.appendChild(div);
            }
        });

        modal.classList.remove("hidden");
    });

    cancelBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    createBtn.addEventListener("click", () => {
        const selected = userList.querySelectorAll(".selected");
        selectedUserIds = Array.from(selected).map((el) => el.dataset.userid);

        if (selectedUserIds.length === 0) {
            alert("Please select at least one user.");
            return;
        }

        modal.classList.add("hidden");
        groupDetailsModal.classList.remove("hidden");

    });

    cancelGroupDetailsBtn.addEventListener("click", () => {
        groupDetailsModal.classList.add("hidden");
    });

    groupAvatarInput.addEventListener("change", () => {
        const file = groupAvatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                avatarPreview.style.backgroundImage = `url(${reader.result})`;
            };
            reader.readAsDataURL(file);
        }
    });
    avatarPreview.onclick = () => {
        groupAvatarInput.click();
    }

    finalCreateBtn.addEventListener("click", async () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
            alert("Please enter a group name.");
            return;
        }

        const avatarFile = groupAvatarInput.files[0];
        selectedUserIds.push(currentId)
        const formData = new FormData();
        formData.append("name", groupName);
        formData.append("members", JSON.stringify(selectedUserIds));
        formData.append("isGroup", true);
        if (avatarFile) {
            formData.append("avatar", avatarFile);
        }

        await axios.post("/api/v1/conversations",formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }})

        groupDetailsModal.classList.add("hidden");
    });
}

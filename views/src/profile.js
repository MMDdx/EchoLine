import axios from "axios";
let token;

import {refreshToken} from "./refreshTok";

const setAccessToken = (body) => {
    sessionStorage.setItem('AccessToken', body.data.AccessToken);
}

const getAccessToken = () => {
    return  sessionStorage.getItem('AccessToken');
}



export function initProfileModal() {
    const userInfo = document.querySelector(".user-info");
    const userModal = document.getElementById("user-info-modal");
    const cancelBtn = document.getElementById("cancel-user-edit-btn");
    const saveBtn = document.getElementById("save-user-edit-btn");
    const avatarInput = document.getElementById("edit-avatar");
    const avatarImage = document.getElementById("avatar-image");

    const usernameInput = document.getElementById("edit-username");
    const firstNameInput = document.getElementById("edit-firstname");
    const lastNameInput = document.getElementById("edit-lastname");

    const curPasswordInput = document.getElementById("current-password");
    const newPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-password");


    const usernameInputVal = usernameInput.value;
    const firstNameInputVal = firstNameInput.value;
    const lastNameInputVal = lastNameInput.value;

    let changeData = true;

    if (!userInfo || !userModal || !cancelBtn) return;

    // Open modal on click
    userInfo.addEventListener("click", () => {
        userModal.classList.remove("hidden");
    });


    saveBtn.onclick =async () => {
        const formData = new FormData();
        if (usernameInputVal !== usernameInput.value) formData.append("username", usernameInput.value);
        if (firstNameInputVal !== firstNameInput.value) formData.append("firstName", firstNameInput.value);
        if (lastNameInputVal !== lastNameInput.value) formData.append("lastName", lastNameInput.value);

        const avatarFile = document.getElementById("edit-avatar").files[0];
        if (avatarFile) formData.append("avatar", avatarFile);


        if ([...formData.entries()].length === 0 ) {
            changeData = false;
        }

        if (changeData){
            try {
                const data = await axios.patch("api/v1/users/updateMe/", formData);
                if (data.status === 200){
                    alert("updated successfully!");
                    setTimeout(()=>{
                        location.reload();
                    }, 2000)
                }
                else {
                    alert("Update failed.");
                }

            } catch (e) {
                if (e.status === 401){
                    token = await refreshToken()
                    return saveBtn.click();
                }
                console.log(e)
                alert("error updating profile");
            }
        }

        if (newPasswordInput.value && confirmPasswordInput.value) {
            if (curPasswordInput.value){
                if (newPasswordInput.value !== confirmPasswordInput.value) return alert("passwords do not match!");
                try{
                    const res = await axios.patch("api/v1/users/updatePassword", {
                        currentPassword: curPasswordInput.value,
                        password: newPasswordInput.value,
                        confirmPassword: confirmPasswordInput.value,
                    })

                    if (res.status === 200){
                        alert("password updated successfully!");

                    }
                }catch (e) {
                    if (e.status === 401){
                        token = await refreshToken()
                        return saveBtn.click();
                    }
                    console.log(e)
                }

            }
            else {
                return alert("for changing password, you must enter your current password!")
            }
        }
        return alert("nothing was changed!")
    }

    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            avatarImage.src = url;
        }
    });


    // Close modal
    cancelBtn.addEventListener("click", () => {
        userModal.classList.add("hidden");
    });

    // Close with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            userModal.classList.add("hidden");
        }
    });
}

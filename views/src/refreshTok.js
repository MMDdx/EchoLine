import axios from "axios";
import {showNotification} from "./chat";

const setAccessToken = (body) => {
    sessionStorage.setItem('AccessToken', body.data.AccessToken);
}

export const getAccessToken = () => {
    return  sessionStorage.getItem('AccessToken');
}

export const refreshToken = async () => {
    let accessToken;
    try{
        accessToken = await axios.get(`/api/v1/users/refresh`);
    }
    catch (e){
        showNotification("please login again!", "error")
        location.replace("/");
        return
    }

    setAccessToken(await accessToken);

    axios.defaults.headers.common['authorization'] = `Bearer ${getAccessToken()}`;
    return getAccessToken();
}
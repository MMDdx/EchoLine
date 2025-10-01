import axios from "axios";

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
        console.log('failed to refresh!!')
        alert("please login again!")
        location.replace("/");
        return
    }
    console.log("getting access token...")
    setAccessToken(await accessToken);

    axios.defaults.headers.common['authorization'] = `Bearer ${getAccessToken()}`;
    return getAccessToken();
}
import axios from "axios";


const axiosPublic = axios.create({
    baseURL: 'https://bistro-boss-web-server.onrender.com',

});

const useAxiosPublic = () => {
    return (axiosPublic)
};

export default useAxiosPublic;
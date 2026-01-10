import axios from "axios";

const API = axios.create({
  baseURL: "https://chatter-backend-9ujs.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;

import axios from "axios";

let service = axios.create({
  baseURL: "http://110.41.21.66:8080",
  timeout: 3000,
});

export default service;

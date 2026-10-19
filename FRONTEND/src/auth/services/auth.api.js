import axios from "axios";
import { apiConfig } from "./api.config";

export async function register(username,email,password){
    try{
        const response=await axios.post("/api/auth/register",{email,username,password},apiConfig);
        // if backend returns token, store and set Authorization header
        if(response?.data?.token){
            const token = response.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return response.data;
    }catch(err){
        throw err.response.data;
    }  
}


export async function login(email,password){
    try{
        const response=await axios.post("/api/auth/login",{email,password},apiConfig);
        if(response?.data?.token){
            const token = response.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

export async function logout(){
    try{
        const response=await axios.get("/api/auth/logout",apiConfig);
        // clear stored token and Authorization header
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

export async function getProfile(){
    try{
        // Make sure Authorization header is set from storage if present
        const stored = localStorage.getItem('token');
        if(stored && !axios.defaults.headers.common['Authorization']){
            axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
        }
        const response=await axios.get("/api/auth/getuser",apiConfig);
        return response.data;
    }catch(err){
        // Return a safe value instead of throwing so callers can handle unauthenticated state
        return { user: null, error: err.response?.data || err };
    }
}
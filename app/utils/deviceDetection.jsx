'use server';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';

const deviceTypeDetector = async () => {
    // Await the headers() function
    const ua = navigator.userAgent.toLowerCase();
    let deviceType = "desktop"
    if (ua.includes("wv") || ua.includes("webview") || ua.includes("expo")) {
        deviceType = "mobile";
    } else {
        deviceType = "desktop";
    }    
    return deviceType;
};

export default deviceTypeDetector;
'use server';
import { userAgent } from 'next/server';
import { headers } from 'next/headers';

const deviceTypeDetector = async () => {
   const userAgent = req.headers['user-agent'] || '';
    const isWebView = /(WebView|Facebook|Instagram|Line|Twitter|WhatsApp)/i.test(userAgent);
    let deviceType = ""
    if(isWebView){
        deviceType = "mobile"
    }
    return deviceType;
};

export default deviceTypeDetector;
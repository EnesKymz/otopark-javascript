'use server';

const deviceTypeDetector = async () => {
    // Await the headers() function
      const ua = navigator.userAgent.toLowerCase();
    const deviceType = ua.includes("webview") ? "mobile" : "desktop";
    return deviceType;
};

export default deviceTypeDetector;
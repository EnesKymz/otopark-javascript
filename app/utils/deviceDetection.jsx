// app/utils/deviceDetector.ts
'use server';

import { headers } from 'next/headers';

const deviceTypeDetector = async ()=> {
  const userAgent = headers().get('user-agent') || '';
  
  // WebView kontrolü
  const isWebView = /(WebView|FBAN|Instagram|Line|Twitter|WhatsApp)/i.test(userAgent);
  
  // Mobil cihaz kontrolü
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  let deviceType = ""
  
  if (isWebView || isMobile) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }
  
  return deviceType;
};
export default deviceTypeDetector
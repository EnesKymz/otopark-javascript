export function getTurkeyDate() {
    const now = new Date();
    const offset = 3 * 60 * 60 * 1000;
    const turkeyTime = new Date(now.getTime() + offset);
    
    return turkeyTime.toISOString().split('T')[0]; // "2025-04-01"
  }
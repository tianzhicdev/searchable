function getOrCreateVisitorId() {
    const STORAGE_KEY = 'visitorId';
    
    // Check if ID already exists in localStorage
    let visitorId = localStorage.getItem(STORAGE_KEY);
    
    // If not, generate a new unique ID and store it
    if (!visitorId) {
      visitorId = 'v' + Math.random().toString(36).substr(2, 9); // e.g., "visitor_kx9l2m4n"
      localStorage.setItem(STORAGE_KEY, visitorId);
    }
    console.log("visitorId", visitorId);
    
    return visitorId;
  }

// Export the function so it can be imported in other files
export { getOrCreateVisitorId };
  
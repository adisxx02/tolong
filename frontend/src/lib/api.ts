/// <reference types="vite/client" />

// API service for communicating with the backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // Try to parse the error message from the response
    const error = await response.json().catch(() => ({
      message: `Server returned ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }
  
  // Check if response is empty
  const text = await response.text();
  if (!text) {
    console.error('Empty response from server');
    throw new Error('Server returned an empty response');
  }
  
  // Try to parse the JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON response:', text);
    throw new Error('Invalid JSON response from server');
  }
};

// Modified addOrder function with better error handling
const addOrder = async (order: any) => {
  console.log('API: Sending order to server:', order);
  
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    console.log('API: Order submission response status:', response.status);
    
    // Check if the request was successful
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('API: Order submission failed:', errorText);
        
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Server error ${response.status}`);
      } catch (parseError) {
        // If parsing fails, use the raw text
        throw new Error(`Server returned error ${response.status}: ${errorText || response.statusText}`);
      }
    }
    
    // Important fix: Clone the response before consuming its body
    // This avoids the "body already consumed" error
    const responseClone = response.clone();
    
    // Try to get the response text
    let text = '';
    try {
      text = await response.text();
      console.log('API: Order submission raw response:', text);
    } catch (textError) {
      console.error('API: Error reading response text:', textError);
      
      // Try to use the cloned response as fallback
      try {
        text = await responseClone.text();
      } catch (cloneError) {
        console.error('API: Failed to read response clone:', cloneError);
        throw new Error('Failed to read server response');
      }
    }
    
    if (!text || text.trim() === '') {
      console.warn('API: Server returned empty response, returning generic success');
      // Return a minimal success object if response is empty
      return { success: true, message: 'Order created (no details returned from server)' };
    }
    
    // Parse response
    try {
      const data = JSON.parse(text);
      console.log('API: Order created successfully:', data);
      return data;
    } catch (parseError) {
      console.error('API: Failed to parse order response:', parseError, 'Raw text:', text);
      // Return a minimal success object with the raw text for debugging
      return { 
        success: true, 
        message: 'Order created but response could not be parsed', 
        rawResponse: text 
      };
    }
  } catch (error) {
    console.error('API: Order submission error:', error);
    throw error;
  }
};

export const api = {
  // Medicine endpoints
  getMedicines: () => 
    fetch(`${API_URL}/medicines`)
      .then(handleResponse),
  
  getMedicineById: (id: string) => 
    fetch(`${API_URL}/medicines/${id}`)
      .then(handleResponse),
  
  addMedicine: (medicine: any) => 
    fetch(`${API_URL}/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    }).then(handleResponse),
  
  updateMedicine: (id: string, medicine: any) => 
    fetch(`${API_URL}/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine)
    }).then(handleResponse),
  
  deleteMedicine: (id: string) => 
    fetch(`${API_URL}/medicines/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),
  
  updateStock: (id: string, stockData: any) => 
    fetch(`${API_URL}/medicines/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockData)
    }).then(handleResponse),
  
  // Order endpoints
  getOrders: () => 
    fetch(`${API_URL}/orders`)
      .then(handleResponse),
  
  getOrderById: (id: string) => 
    fetch(`${API_URL}/orders/${id}`)
      .then(handleResponse),
  
  getOrdersByUserId: (userId: string) => 
    fetch(`${API_URL}/orders/user/${userId}`)
      .then(handleResponse),
  
  // Replace the existing addOrder with our enhanced version
  addOrder,
  
  updateOrderStatus: (id: string, status: string) => 
    fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(handleResponse),
  
  updateOrderNotes: (id: string, notes: string) => 
    fetch(`${API_URL}/orders/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    }).then(handleResponse),
  
  deleteOrder: (id: string) => 
    fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),
  
  // Authentication endpoints
  login: (credentials: { username: string, password: string }) => 
    fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(handleResponse),
  
  register: (userData: any) => 
    fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),
  
  getUsers: () => 
    fetch(`${API_URL}/users`)
      .then(handleResponse),
  
  getUserById: (id: string) => 
    fetch(`${API_URL}/users/${id}`)
      .then(handleResponse),
  
  updateUser: (id: string, userData: any) => 
    fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),
    
  updatePassword: (id: string, passwordData: { currentPassword: string, newPassword: string }) => 
    fetch(`${API_URL}/users/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
    }).then(handleResponse),
    
  deleteUser: (id: string) => 
    fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    }).then(handleResponse)
};
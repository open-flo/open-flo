/**
 * API service for HTTP requests
 */

import { API_ENDPOINTS } from '../constants/Defaults.js';

export class ApiService {
  constructor(options = {}) {
    this.options = options;
    this.baseUrl = options.baseUrl || '';
  }

  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async get(url, options = {}) {
    return this.request(url, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async post(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a generic request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url;
    
    try {
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Query flows using the new API endpoint
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise} - Query results
   */
  async queryFlows(query, options = {}) {
    const queryData = {
      query
    };

    // Add project_id as URL parameter
    const url = `${API_ENDPOINTS.query}?project_id=${this.options.projectId}`;

    return this.post(url, queryData, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Search flows (deprecated - use queryFlows instead)
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise} - Search results
   */
  async searchFlows(query, options = {}) {
    const searchData = {
      query,
      project_id: this.options.projectId,
      limit: options.limit || 3,
      ...options
    };

    return this.post(API_ENDPOINTS.search, searchData);
  }

  /**
   * Get flow details
   * @param {string} flowName - Flow name
   * @returns {Promise} - Flow details
   */
  async getFlowDetails(flowName) {
    return this.get(`${API_ENDPOINTS.flowDetails}/${flowName}`);
  }

  /**
   * Send chat query
   * @param {string} query - Chat query
   * @param {Object} options - Request options
   * @returns {Promise} - Chat response
   */
  async sendChatQuery(query, flows = []) {
    const chatData = {
      query,
      flows
    };

    // Add project_id as URL parameter
    const url = `${API_ENDPOINTS.chat}?project_id=${this.options.projectId}`;

    return this.post(url, chatData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
} 
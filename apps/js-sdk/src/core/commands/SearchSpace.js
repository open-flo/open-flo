/**
 * Lightweight SearchSpace base class to describe a searchable domain.
 * Concrete spaces should extend this or provide a plain object with the same API.
 */

export class SearchSpace {
  constructor(config = {}) {
    // Set class properties from config
    this.name = config.name;
    this.url = config.url;
    this.auth_config = config.auth_config;
    this.data_list_path = config.data_list_path;
    this.navigation_url_formula = config.navigation_url_formula;
    this.navigation_title_formula = config.navigation_title_formula;

    if (!this.name) {
      throw new Error('SearchSpace requires name');
    }
  }

  /**
   * Query function for this search space
   * @param {string} query - Search query string
   * @returns {Promise<Array>} - Array of search results
   */
  async query(query) {

    try {
      // Get authentication token based on auth_config
      let authToken = null;
      if (this.auth_config && this.auth_config.type === 'Bearer' && this.auth_config.source) {
        if (this.auth_config.source.from === 'cookie') {
          authToken = SearchSpace._getCookie(this.auth_config.source.name);
        }
      }

      if (!authToken) {
        console.error(`Authentication token not found for ${this.name}`);
        return [];
      }

      // Replace ${query} in URL template
      const apiUrl = this.url.replace('${query}', encodeURIComponent(query));

      // Make API request
      const response = await fetch(apiUrl, {
        headers: {
          'authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Extract data using data_list_path
      const listData = SearchSpace._extractDataByPath(data, this.data_list_path);
      
      if (!Array.isArray(listData)) {
        return [];
      }

      // Transform data to required format
      return listData.map(item => {
        console.log('SearchSpace item:', item);
        console.log('navigation_url_formula:', this.navigation_url_formula);
        console.log('navigation_title_formula:', this.navigation_title_formula);
        return {
          url: SearchSpace._processFormula(this.navigation_url_formula, item),
          title: SearchSpace._processFormula(this.navigation_title_formula, item),
          description: item.description || 'No description available'
        };
      });

    } catch (error) {
      console.error(`Error in ${this.name} search:`, error);
      return [];
    }
  }

  /**
   * Factory method to create SearchSpace from configuration
   * @param {Object} config - Search hook configuration
   * @returns {SearchSpace} - Configured SearchSpace instance
   */
  static fromConfig(config) {
    if (!config.search_hook_id || !config.name || !config.url) {
      throw new Error('SearchSpace config requires search_hook_id, name, and url');
    }

    return new SearchSpace(config);
  }

  /**
   * Helper method to get cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} - Cookie value or null
   */
  static _getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Helper method to extract data by JSONPath-like path
   * @param {Object} data - Source data
   * @param {string} path - JSONPath (e.g., "$.data")
   * @returns {any} - Extracted data
   */
  static _extractDataByPath(data, path) {
    if (!path || path === '$') return data;
    
    // Simple implementation for $.data, $.data.items, etc.
    const segments = path.split('.').filter(s => s && s !== '$');
    let result = data;
    
    for (const segment of segments) {
      if (result && typeof result === 'object') {
        result = result[segment];
      } else {
        return undefined;
      }
    }
    
    return result;
  }

  /**
   * Helper method to process formula templates
   * @param {string} formula - Formula template (e.g., "https://example.com/${data['$.id']}")
   * @param {Object} data - Data object
   * @returns {string} - Processed formula
   */
  static _processFormula(formula, data) {
    if (!formula) return '';
  
    // Resolve paths like $.a.b[0]['c d'] or a.b, or ['weird.key']
    const resolvePath = (obj, rawPath) => {
      if (obj == null) return '';
      if (!rawPath) return '';
  
      // Normalize: drop leading $ and optional dot
      let path = String(rawPath).trim();
      if (path.startsWith('$')) path = path.slice(1);
      if (path.startsWith('.')) path = path.slice(1);
  
      // Extract segments from dot/bracket notation
      const segs = [];
      const re = /(?:\.([A-Za-z_$][\w$]*))|\[['"]([^'"]+)['"]\]|\[(\d+)\]/g;
      let m;
  
      // If there's no bracket/dot tokens (e.g., "project_id"), treat as single segment
      if (!/[.\[]/.test(path)) segs.push(path);
      else {
        // Also allow the first bare identifier before any dot/bracket (e.g., "a.b[0]")
        const first = path.match(/^[A-Za-z_$][\w$]*/);
        let idx = 0;
        if (first) {
          segs.push(first[0]);
          idx = first[0].length;
        }
        re.lastIndex = idx;
        while ((m = re.exec(path)) !== null) {
          segs.push(m[1] ?? m[2] ?? m[3]);
        }
      }
  
      // Walk the object
      let cur = obj;
      for (const s of segs) {
        if (cur == null) return '';
        const key = /^\d+$/.test(s) ? Number(s) : s;
        cur = cur[key];
      }
  
      // If value is object/array, stringify; else return as-is (preserve falsy)
      return (cur !== undefined && cur !== null)
        ? (typeof cur === 'object' ? JSON.stringify(cur) : String(cur))
        : '';
    };
  
    // Handle ${data['...']} and ${data....} variants
    // 1) ${data['...']}
    let out = formula.replace(/\$\{data\['([^']+)'\]\}/g, (_, path) => resolvePath(data, path));
    // 2) ${data.some.path[0]['weird.key']}
    out = out.replace(/\$\{data\.([^}]+)\}/g, (_, path) => resolvePath(data, path));
  
    // Also allow ${...} without the "data." prefix as a convenience (optional)
    out = out.replace(/\$\{([^}]+)\}/g, (match, path) => {
      // If it already matched above (started with "data"), skip
      if (/^\s*data(\.|\[)/.test(path)) return match;
      return resolvePath(data, path);
    });
  
    return out;
  }


  static fromConfig(config) {
    return new SearchSpace(config);
  }
}
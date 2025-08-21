/**
 * SearchHook encapsulates "/" search across multiple spaces.
 */

export class SearchHook {
  /**
   * @param {import('./CommandTypes.js').SearchHookConfig} config
   */
  constructor(config) {
    const {
      id = 'hook.search',
      name = 'Search',
      description = 'Search across spaces',
      priority = 100,
      debounceMs = 300,
      maxSpacesShown = 6,
      spaces = []
    } = config || {};

    this.id = id;
    this.trigger = '/';
    this.name = name;
    this.description = description;
    this.priority = priority;
    this.debounceMs = debounceMs;
    this.maxSpacesShown = maxSpacesShown;
    this.spaces = spaces;
    this.selectedSpace = null;
  }



  /**
   * Return available spaces (could be dynamic)
   * @param {any} context
   * @returns {Array}
   */
  getSpacesNames() {
    return this.spaces.map(space => space.name);
  }

  setSelectedSpace(space) {
    this.selectedSpace = space;
  }

  initializeSpaces(spaceConfigs) {
    this.spaces = spaceConfigs.map(spaceConfig => {
      return SearchSpace.fromConfig(spaceConfig);
    });
  }

  getSelectedSpace() {
    return this.selectedSpace;
  }

  queryInSelectedSpace(query) {
    return this.selectedSpace.query(query);
  }
}



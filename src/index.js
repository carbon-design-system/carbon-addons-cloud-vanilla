// ====================//
// Imports and Exports //
// ====================//

// Base Elements & Components
// -------------
// - JavaScript classes for use with components and base-elements.
// - The following statements import classes from actual locations to
//   be consumed from this file instead of their actual locations.
import DetailPageHeader from './components/detail-page-header/detail-page-header';
import LeftNav from './components/unified-header/left-nav';
import ProfileSwitcher from './components/unified-header/profile-switcher';

const settings = {};

/**
 * This module is used for the following purposes:
 * 1. Export ES2015 classes as modules (used with base-elements and components)
 * 2. Build an ES5-compatible files for prototyping.
 *    See /path/to/bluemix-components/dist/dist-demo.html for details.
 * @exports CarbonAddonsBluemix
 * @example <caption>Consume ES2015 modules from this file using import (Usage pattern 1.)</caption>
 * import { Fab, FileUploader } from '/path/to/your/project/node_modules/@console/bluemix-components';
 */
export {
  /**
   * Settings.
   * @type Object
   * @property {boolean} [disableAutoInit]
   *   Disables automatic instantiation of components.
   *   By default (`CarbonAddonsBluemix.disableAutoInit` is `false`),
   *   bluemix-components attempts to instantiate components automatically
   *   by searching for elements with `data-component-name` (e.g. `data-loading`) attribute
   *   or upon DOM events (e.g. clicking) on such elements.
   *   See each components' static `.init()` methods for details.
   */
  settings,
  /**
   * Left Navigation Menu
   * @type LeftNav
   */
  LeftNav,
  /**
   * Detail page header.
   * @type DetailPageHeader
   */
  DetailPageHeader,
  /**
   * Profile Switcher.
   * @type ProfileSwitcher
   */
  ProfileSwitcher,
};

/**
 * List of component classes to be auto-instantiated.
 * @private
 */
export const componentClasses = [DetailPageHeader, LeftNav, ProfileSwitcher];

/**
 * Instantiates components automatically
 * by searching for elements with `data-component-name` (e.g. `data-loading`) attribute
 * or upon DOM events (e.g. clicking) on such elements.
 * See each components' static `.init()` methods for details.
 * @private
 */
const init = () => {
  if (!settings.disableAutoInit) {
    componentClasses.forEach(Clz => {
      Clz.init();
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOMContentLoaded has been fired already
  // Let consumer have chance to see if it wants automatic instantiation disabled, and then run automatic instantiation otherwise
  setTimeout(init, 0);
}

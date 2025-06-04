import { createRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

/**
 * Navigation reference that can be used outside of components
 */
export const navigationRef = createRef<NavigationContainerRef<any>>();

/**
 * Navigate to a screen
 * @param name Screen name
 * @param params Parameters to pass to the screen
 */
export function navigate(name: string, params?: any) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    // Navigation attempted before navigation container was ready
    console.warn('Navigation attempted before navigationRef was set');
  }
}

/**
 * Go back to the previous screen
 */
export function goBack() {
  if (navigationRef.current) {
    navigationRef.current.goBack();
  }
}

/**
 * Reset the navigation state to the provided state
 * @param state New navigation state
 */
export function reset(state: any) {
  if (navigationRef.current) {
    navigationRef.current.reset(state);
  }
}

/**
 * Get the current route name
 */
export function getCurrentRoute() {
  if (navigationRef.current) {
    return navigationRef.current.getCurrentRoute()?.name;
  }
  return null;
}

/**
 * Navigate to the authentication screen and reset the stack
 */
export function navigateToAuth() {
  if (navigationRef.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  }
}

/**
 * Navigate to the main application and reset the stack
 */
export function navigateToMain() {
  if (navigationRef.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }
}

/**
 * Navigate to a specific tab in the main navigator
 * @param tabName Tab name to navigate to
 * @param params Optional params for the screen
 */
export function navigateToTab(tabName: string, params?: any) {
  if (navigationRef.current) {
    navigationRef.current.navigate(tabName, params);
  }
}

export default {
  navigate,
  goBack,
  reset,
  getCurrentRoute,
  navigateToAuth,
  navigateToMain,
  navigateToTab,
};
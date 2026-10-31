import { Platform } from 'react-native';

// "Selected" state for a button that toggles on and off (a call control, a
// schedule day, a symptom option). Screen readers on iOS and Android announce
// it as "selected"; on the web aria-selected isn't allowed on a button, so the
// toggle-button state (aria-pressed) is used there instead.
export function selectedButtonState(selected: boolean) {
  return Platform.OS === 'web' ? { 'aria-pressed': selected } : { 'aria-selected': selected };
}

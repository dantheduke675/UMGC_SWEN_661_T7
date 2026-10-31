/**
 * selectedButtonState: the "selected" state of a toggling button, in the form
 * each platform's screen readers understand.
 */
import { Platform } from 'react-native';
import { selectedButtonState } from '../src/constants/a11y';

describe('selectedButtonState', () => {
  const realOS = Platform.OS;
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: realOS, configurable: true });
  });

  it.each(['ios', 'android'] as const)('is "selected" on %s', os => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    expect(selectedButtonState(true)).toEqual({ 'aria-selected': true });
    expect(selectedButtonState(false)).toEqual({ 'aria-selected': false });
  });

  // aria-selected isn't allowed on a button on the web; a toggle button is pressed
  it('is "pressed" on the web', () => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    expect(selectedButtonState(true)).toEqual({ 'aria-pressed': true });
    expect(selectedButtonState(false)).toEqual({ 'aria-pressed': false });
  });
});

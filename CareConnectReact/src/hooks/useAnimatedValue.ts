/**
 * useAnimatedValue
 * Creates an Animated.Value that stays stable for the lifetime of the component.
 *
 * React Native ships its own useAnimatedValue, but react-native-web does not
 * re-export it, so importing it from 'react-native' resolves to undefined on
 * web and throws as soon as the component renders. This local version works on
 * every platform.
 *
 * useState's lazy initialiser gives the same create-once guarantee as the
 * older `useRef(new Animated.Value(0)).current` idiom, without reading a ref
 * during render — which the React Compiler lint rules reject.
 */
import { useState } from 'react';
import { Animated } from 'react-native';

export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}

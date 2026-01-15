/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1877F2';
const tintColorDark = '#1877F2';

export const Colors = {
  light: {
    text: '#1C1E21',
    background: '#F0F2F5',
    card: '#FFFFFF',
    tint: tintColorLight,
    icon: '#65676B',
    muted: '#65676B',
    border: '#DADDE1',
    inputBackground: '#F5F6F7',
    danger: '#E41E3F',
    success: '#42B72A',
    tabIconDefault: '#65676B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E4E6EB',
    background: '#18191A',
    card: '#242526',
    tint: tintColorDark,
    icon: '#B0B3B8',
    muted: '#B0B3B8',
    border: '#3A3B3C',
    inputBackground: '#3A3B3C',
    danger: '#E41E3F',
    success: '#42B72A',
    tabIconDefault: '#B0B3B8',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

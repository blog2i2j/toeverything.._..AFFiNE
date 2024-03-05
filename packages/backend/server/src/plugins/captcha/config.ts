import { defineStartupConfig, ModuleConfig } from '../../fundamentals/config';
import { CaptchaConfig } from './types';

declare module '../config' {
  interface PluginsConfig {
    captcha: ModuleConfig<CaptchaConfig>;
  }
}

defineStartupConfig('plugins.captcha', {
  turnstile: {
    secret: '',
  },
  challenge: {
    bits: 20,
  },
});
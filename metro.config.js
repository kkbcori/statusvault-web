const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports resolution — prevents Metro from loading
// the ESM/import.meta paths in @supabase/supabase-js dependencies
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

module.exports = config;

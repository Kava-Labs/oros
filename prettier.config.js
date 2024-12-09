/**
 * Enable "formatOnSave" in VSCode to automagically apply prettier styles to saved files.
 * There are two options for setting this up via settings:
 * a) Code > Settings > Settings: Search for "Format On Save": Check the box
 * b) Copy editor.config.json file in this repo
 *    Open VS Code editor
 *    Type: CMD + Shift + P
 *    Search for: Worskspace Settings (JSON)
 *    Manually edit your settings.json file to include:
 *    "editor.formatOnSave": true
 *
 * Additionally, there is a Prettier - Code formatter VS Code extension that can be used
 */

const config = {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  endOfLine: 'lf',
  bracketSameLine: false,
};
export default config;

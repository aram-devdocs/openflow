/**
 * Services Index
 *
 * Re-exports all service modules.
 */

export { AppManager, getAppManager } from './app-manager.js';
export {
  runCommand,
  runPnpmScript,
  runCargoCommand,
  parseLintOutput,
  parseTestOutput,
  parseTypecheckOutput,
  parseCargoOutput,
} from './command-runner.js';
export {
  TauriBridge,
  getTauriBridge,
  resetTauriBridge,
  DEFAULT_SOCKET_PATH,
  type ConnectionState,
  type ConnectionStatus,
  type ScreenshotParams,
  type ScreenshotResult,
  type ExecuteJsParams,
  type ExecuteJsResult,
  type MouseParams,
  type MouseResult,
  type TextInputParams,
  type TextInputResult,
  type GetElementPositionParams,
  type ElementPositionResult,
  type SendTextToElementParams,
  type LocalStorageParams,
  type LocalStorageResult,
  type DomResult,
} from './tauri-bridge.js';

import { generatorCtrl, type GeneratorFunctionType } from './core'
export * from './core'
type OnCleanup = (cleanupFn: () => void) => void

/**
 * 将 Generator 函数包装，该函数可以作为 `watch` 的第二个参数回调函数。
 * 在开始新执行之前取消任何先前的未执行完成的流程。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @returns 返回一个函数，作为 `watch` 的回调函数。
 */
export function watchCallbackGeneratorWarp<T extends GeneratorFunctionType>(
  fetchGenerator: T
): (val: unknown, oldVal: unknown, onCleanup: OnCleanup) => void {
  return (val, oldVal, onCleanup) => {
    const { cancel, doFetch } = generatorCtrl(fetchGenerator, [val, oldVal] as Parameters<T>)
    onCleanup(cancel)
    doFetch()
  }
}

/**
 * 将 Generator 函数包装，该函数可以作为 `watchEffect` 的回调函数。
 * 在开始新执行之前取消任何先前的未执行完成的流程。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @returns 返回一个函数，作为 `watchEffect` 的回调函数。
 */
export function watchEffectCallbackGeneratorWarp<T extends GeneratorFunctionType>(
  fetchGenerator: T
): (onCleanup: OnCleanup) => void {
  return (onCleanup) => {
    const { cancel, doFetch } = generatorCtrl(fetchGenerator)
    onCleanup(cancel)
    doFetch()
  }
}

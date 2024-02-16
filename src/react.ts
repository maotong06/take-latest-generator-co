import { useRef, useCallback, useEffect } from 'react'
import { generatorCtrl, type GeneratorFunctionReturn } from './core'
export * from './core'

type DependencyList = readonly unknown[]

/**
 * useCallBack 的 takeLatest 版本，在依赖数组未发生变化的情况下，新的执行会自动取消上一次的未完成的执行。
 * 所以为了能保证每次都能打断，deps 最好是空数组。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @param deps - 依赖数组
 * @returns 返回一个 async 函数，该函数在开始新执行之前取消任何先前的未执行完成的流程。
 */
export function useCallBackTakeLatest<T extends GeneratorFunction>(
  fetchGenerator: T,
  deps: DependencyList
): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T> | any> {
  const lastCancel = useRef<() => void>()
  return useCallback(async function (...args) {
    if (lastCancel.current) {
      lastCancel.current()
    }
    const { cancel, doFetch } = generatorCtrl(fetchGenerator, args)
    lastCancel.current = cancel
    return await doFetch()
  }, deps)
}

/**
 * useEffect 的 takeLatest 版本，新的执行会自动取消上一次的未完成的执行。
 *
 * @param  fetchGenerator - Generator 函数。
 * @param  deps - useEffect 的依赖数组
 */
export function useEffectTakeLatest<T extends GeneratorFunction>(
  fetchGenerator: T,
  deps: DependencyList
): void {
  useEffect(() => {
    const { cancel, doFetch } = generatorCtrl(fetchGenerator)
    doFetch()
    return cancel
  }, deps)
}

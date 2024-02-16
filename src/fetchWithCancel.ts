import type { PromiseWithCancel } from './core'

declare type IFetch = typeof fetch
/**
 * 包含取消方法的 fetch 函数。返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 * @param  args - fetch 函数的参数
 * @returns {Promise<Response>} - 返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 */
export function fetchWithCancel(...args: Parameters<IFetch>): PromiseWithCancel<Response> {
  if (args[1]?.signal) {
    return fetch(...args)
  } else {
    const ac = new AbortController()
    const { signal } = ac
    const fetch2 = fetch(args[0], {
      signal,
      ...args[1]
    }) as PromiseWithCancel<Response>
    fetch2.abortThisPromise = (reason) => {
      ac.abort()
      fetch2.__ABORT_REASON__ = reason
    }
    return fetch2
  }
}

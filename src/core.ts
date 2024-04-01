export declare interface PromiseWithCancel<T> extends Promise<T> {
  abortThisPromise?(reason?: EAboutReason | string): void
  __ABORT_REASON__?: string
}
/** 根据 GeneratorFunctionType 推断 迭代器最后的return值
 *  @template Gf - GeneratorFunctionType
 * */
export declare type GeneratorFunctionReturn<Gf extends GeneratorFunctionType> =
  ReturnType<Gf> extends Generator<any, infer R, any> ? R : never

export type GeneratorFunctionType<T = unknown, TReturn = any, TNext = unknown> = (...args: any[]) => Generator<T, TReturn, TNext>;

export enum EAboutReason {
  CANCEL = 'cancel'
}

/**
 * 给 Promise 添加取消方法，包括  'all', 'allSettled', 'any', 'race'。
 * 增加的方法后缀默认为 'WithCancel'，可以通过参数修改。
 * @param {PromiseConstructor} originPromise - Promise 原始对象。
 * @param {string} [suffix='WithCancel'] - The suffix to be added to the cancellation methods.
 */
export function appendPromiseCancelMethods(
  originPromise: PromiseConstructor,
  suffix = 'WithCancel'
) {
  ;['all', 'allSettled', 'any', 'race'].forEach((i) => {
    if ((originPromise as any)[i]) {
      const newFunction = (...args: any[]) => {
        const resPromise = (originPromise as any)[i](...args)
        resPromise.abortThisPromise = (reason: any) => {
          args.forEach((subPromise) => subPromise.abortThisPromise?.(reason))
          resPromise.__ABORT_REASON__ = reason
        }
        return resPromise
      }
      (originPromise as any)[i + suffix] = newFunction
    }
  })
}

/**
 * Generator 的核心控制函数，控制 Generator 的执行和取消逻辑。
 *
 * @param {Function} fetchGenerator - Generator函数
 * @param {...any} args - fetchGenerator 函数的参数
 * @returns {Object} - 一个对象，包括 doFetch 和 cancel 两个方法，doFetch 用于执行 Generator 函数，cancel 用于取消执行。
 */
export function generatorCtrl<T extends GeneratorFunctionType>(
  fetchGenerator: T,
  args?: Parameters<T>
): {
  doFetch: () => Promise<GeneratorFunctionReturn<T> | any>
  cancel: () => void
} {
  const fetchIterator = fetchGenerator(...(args || []))
  let isCancel = false
  let lastNext: any
  let cancelFun: any
  function cancel() {
    isCancel = true
    cancelFun?.(EAboutReason.CANCEL)
  }
  async function doFetch() {
    let done
    let value: PromiseWithCancel<unknown>
    while (!done) {
      if (isCancel) {
        console.warn('user aborted')
        fetchIterator.return('cancel')
      }
      ;({ value, done } = fetchIterator.next(lastNext))
      try {
        if (value instanceof Promise) {
          if (
            Object.prototype.hasOwnProperty.call(value, "abortThisPromise") &&
            typeof value.abortThisPromise === 'function'
          ) {
            cancelFun = value.abortThisPromise
          }
          lastNext = await value
        } else {
          lastNext = value
        }
      } catch (err) {
        if (
          !(
            value instanceof Promise &&
            Object.prototype.hasOwnProperty.call(value, "abortThisPromise") &&
            value.__ABORT_REASON__ === EAboutReason.CANCEL
          )
        ) {
          fetchIterator.throw(err)
        }
      }
    }

    return lastNext
  }
  return {
    doFetch,
    cancel
  }
}

/**
 * 讲 Generator 函数包装，并返回一个包装过的 async 函数。该函数在开始新执行之前取消任何先前的未执行完成的流程。
 * 保证最后一次执行。
 * @param {Function} fetchGenerator - 需要包装的 Generator 函数
 * @returns {Function} - 返回对应的 async 函数
 */
export function takeLatestWarp<T extends GeneratorFunctionType>(
  fetchGenerator: T
): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T> | any> {
  // 保存取消函数
  let lastCancel: any
  return async function (...args) {
    // 如果有取消函数，先取消打断
    if (lastCancel) {
      lastCancel()
    }
    // 执行 generator 函数，并赋值新的取消函数
    const { cancel, doFetch } = generatorCtrl(fetchGenerator, args)
    lastCancel = cancel
    return await doFetch()
  }
}

/**
 * 一个包装函数，用于 将 Generator 转换成 async 函数，自动执行，无法执行取消操作，像正常的async一样使用。
 * @param {Function} fetchGenerator - 需要包装的 Generator 函数
 * @returns {Function} - 返回对应的 async 函数
 */
export function turnToAsyncWarp<T extends GeneratorFunctionType>(
  fetchGenerator: T
): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T>> {
  return async function (...args) {
    const { doFetch } = generatorCtrl(fetchGenerator, args)
    return await doFetch()
  }
}

/**
 * 定时器，返回一个 Promise，在指定的时间后 resolve，可以取消
 *
 * @param {number} ms - 指定的时间，单位毫秒
 * @returns {Promise} - 返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 */
export function delayWithCancel(ms?: number): PromiseWithCancel<any> {
  const ac = new AbortController()
  const { signal } = ac
  let timer: any
  const promise = new Promise((resolve, reject) => {
    timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException(signal?.reason || 'user aborted', 'AbortError'))
    })
  }) as PromiseWithCancel<any>
  promise.abortThisPromise = (reason) => {
    ac.abort()
    promise.__ABORT_REASON__ = reason
  }
  return promise
}

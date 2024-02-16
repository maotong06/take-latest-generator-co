import type {
  AxiosStatic,
  AxiosInstance,
  CreateAxiosDefaults,
  AxiosResponse,
  AxiosRequestConfig
} from 'axios'
import type { PromiseWithCancel } from './core'
/**
 * 创建带有取消请求功能的 Axios 实例
 * @param {object} originAxios - 原始的 Axios 实例
 * @param {object} config - Axios 实例的配置
 * @returns {object} - 带有取消请求功能的 Axios 实例
 */
export function createAxiosWithCancelRequest(
  originAxios: AxiosStatic,
  config: CreateAxiosDefaults
): AxiosInstance {
  const Axios = originAxios.Axios
  const oldRequest = Axios.prototype.request
  // 重写 request。返回的 Promise 实例上增加 cancel 方法。和上面的fetch一样，方便我们后续的打断操作
  Axios.prototype.request = function <T = any, R = AxiosResponse<T, any>, D = any>(
    reqConfig: AxiosRequestConfig<D>
  ) {
    const ac = new AbortController()
    const promise = oldRequest.call(this, {
      signal: ac.signal,
      ...reqConfig
    }) as PromiseWithCancel<R>
    promise.abortThisPromise = () => {
      ac.abort()
    }
    return promise
  }
  return originAxios.create(config)
}

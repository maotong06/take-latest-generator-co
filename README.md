# take-latest-generator-co

## Description
利用generator解决竞态情况，在少量修改原代码的情况下，就能解决竞态问题。
不需要引入额外的框架。也不需要外部的变量来控制。整体相对于以前用 async/await 方式来写的代码差别很小。

解决方案原理：可查看文章 <a href="详细流程说明.md">详细流程说明</a>

===================

### 安装
```shell
npm install take-latest-generator-co
```

#### 如果需要Promise的静态方法也支持取消，执行一下下面的方法
```javascript
import { appendPromiseCancelMethods } from 'take-latest-generator-co'
// 这会给Promise增加一些静态方法，比如 allWithCancel, allSettledWithCancel, anyWithCancel, raceWithCancel
appendPromiseCancelMethods(Promise)

// 也可以修改后缀，比如 '', 就会重写原来的方法
// appendPromiseCancelMethods(Promise, '')
```

#### 在 vue 中使用：

```javascript
import { watchCallbackGeneratorWarp, takeLatestWarp } from 'take-latest-generator-co/dist/vue'
// 如果想更彻底的取消请求， 节省用户流量。 可以使用 fetchWithCancel，代替 fetch。
import { fetchWithCancel } from 'take-latest-generator-co/dist/fetchWithCancel'


// demo, 网络请求业务函数，改成 generator 函数
function * fetchAndSetData(val) {
  const args = queryList.value[val]
  try {
    firstData.value = yield* fetchDelayTime({ data: args.data + 'f', time: args.time / 2 })
    let res = yield* fetchDelayTime(args);
    secData.value = res
    return res
  } catch (error) {
    console.error('fetchAndSetData error', error)
  }
}

// demo, 封装的网络请求函数
function * fetchDelayTime({ data, time }) {
  let res = yield fetch(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = yield res.json()
  res = res.data
  return res
}

// 一种场景在 watch 时，进行竞态处理
watch(
  () => currentIndex.value,
  // generator 业务函数，进行包装。 处理后的函数，会自动进行竞态处理。
  watchCallbackGeneratorWarp(fetchAndSetData)
);

function changeIndex() {
  currentIndex.value = 1
}

// 另一种场景，点击事件时，进行竞态处理。 takeLatestWarp 包装后的generator函数，会自动进行竞态处理。
const clickFetch = takeLatestWarp(fetchAndSetData)
```

```vue
<button @click="clickFetch()" >
  点击获取数据
</button>
<button @click="changeIndex()" >
  点击触发watch
</button>
```

#### 在 react 中使用：

```jsx
// 如果想更彻底的取消请求， 节省用户流量。 可以使用 fetchWithCancel，代替 fetch。
import { fetchWithCancel } from 'take-latest-generator-co/dist/fetchWithCancel'
import { useCallBackTakeLatest, useEffectTakeLatest, turnToAsyncWarp } from 'take-latest-generator-co/dist/react'

const [currentIndex, setCurrentIndex] = useState()

// demo, 封装的网络请求函数
function * fetchDelayTime({ data, time }) {
  let res = yield fetch(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = yield res.json()
  res = res.data
  return res
}

// demo, 网络请求业务函数，改成 generator 函数
function * effectFetchSetData() {
  if (currentIndex === undefined) return
  const args = queryList[currentIndex]
  const firstD = yield* fetchDelayTime({ data: args.data + 'f', time: args.time / 2 })
  setFirstData(firstD)
  let res = yield* fetchDelayTime(args);
  setSecData(res)
  return res
}

// 一种场景在 useEffect 时， 监听数据变化， 进行竞态处理。 利用 useEffectTakeLatest 这个 hook，进行包装。 处理后的函数，会自动进行竞态处理。 useEffectTakeLatest 是 useEffect 的竞态处理版本。
useEffectTakeLatest(effectFetchSetData, [currentIndex])

// 另一种场景，点击事件时，进行竞态处理。 useCallBackTakeLatest 包装后的 generator 函数，会自动进行竞态处理。 useCallBackTakeLatest 是 useCallback 的竞态处理版本。
const clickFetch = useCallBackTakeLatest(fetchAndSetData, [])

return (
  <div>
    <button onClick={() => clickFetch(index)}>点击处理竞态</button>
    <button onClick={() => setCurrentIndex(index)}>在useEffect中，进行竞态处理</button>
  </div>
)

```

### 本npm包的所有导出函数

##### core.d.ts
```typescript
export declare interface PromiseWithCancel<T> extends Promise<T> {
    abortThisPromise?(reason?: EAboutReason | string): void;
    __ABORT_REASON__?: string;
}
/** 根据 GeneratorFunction 推断 迭代器最后的return值
 *  @template Gf - GeneratorFunction
 * */
export declare type GeneratorFunctionReturn<Gf extends GeneratorFunction> = ReturnType<Gf> extends Generator<any, infer R, any> ? R : never;
export declare enum EAboutReason {
    CANCEL = "cancel"
}
/**
 * 给 Promise 添加带取消函数的一些方法，包括  'all', 'allSettled', 'any', 'race'。
 * 默认会增加 'allWithCancel', 'allSettledWithCancel', 'anyWithCancel', 'raceWithCancel' 四个方法。
 * 增加的方法后缀默认为 'WithCancel'，可以通过参数修改。
 * @param {PromiseConstructor} originPromise - Promise 原始对象。
 * @param {string} [suffix='WithCancel'] - The suffix to be added to the cancellation methods.
 */
export declare function appendPromiseCancelMethods(originPromise: PromiseConstructor, suffix?: string): void;
/**
 * Generator 的核心控制函数，控制 Generator 的执行和取消逻辑。
 *
 * @param {Function} fetchGenerator - Generator函数
 * @param {...any} args - fetchGenerator 函数的参数
 * @returns {Object} - 一个对象，包括 doFetch 和 cancel 两个方法，doFetch 用于执行 Generator 函数，cancel 用于取消执行。
 */
export declare function generatorCtrl<T extends GeneratorFunction>(fetchGenerator: T, args?: Parameters<T>): {
    doFetch: () => Promise<GeneratorFunctionReturn<T> | any>;
    cancel: () => void;
};
/**
 * 讲 Generator 函数包装，并返回一个包装过的 async 函数。该函数在开始新执行之前取消任何先前的未执行完成的流程。
 * 保证最后一次执行。
 * @param {Function} fetchGenerator - 需要包装的 Generator 函数
 * @returns {Function} - 返回对应的 async 函数
 */
export declare function takeLatestWarp<T extends GeneratorFunction>(fetchGenerator: T): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T> | any>;
/**
 * 一个包装函数，用于 将 Generator 转换成 async 函数，自动执行，无法执行取消操作，像正常的async一样使用。
 * @param {Function} fetchGenerator - 需要包装的 Generator 函数
 * @returns {Function} - 返回对应的 async 函数
 */
export declare function turnToAsyncWarp<T extends GeneratorFunction>(fetchGenerator: T): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T>>;
/**
 * 定时器，返回一个 Promise，在指定的时间后 resolve，可以取消
 *
 * @param {number} ms - 指定的时间，单位毫秒
 * @returns {Promise} - 返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 */
export declare function delayWithCancel(ms?: number): PromiseWithCancel<any>;

```

##### react.d.ts
```typescript
import { type GeneratorFunctionReturn } from './core';
export * from './core';
type DependencyList = readonly unknown[];
/**
 * useCallBack 的 takeLatest 版本，在依赖数组未发生变化的情况下，新的执行会自动取消上一次的未完成的执行。
 * 所以为了能保证每次都能打断，deps 最好是空数组。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @param deps - 依赖数组
 * @returns 返回一个 async 函数，该函数在开始新执行之前取消任何先前的未执行完成的流程。
 */
export declare function useCallBackTakeLatest<T extends GeneratorFunction>(fetchGenerator: T, deps: DependencyList): (...args: Parameters<T>) => Promise<GeneratorFunctionReturn<T> | any>;
/**
 * useEffect 的 takeLatest 版本，新的执行会自动取消上一次的未完成的执行。
 *
 * @param  fetchGenerator - Generator 函数。
 * @param  deps - useEffect 的依赖数组
 */
export declare function useEffectTakeLatest<T extends GeneratorFunction>(fetchGenerator: T, deps: DependencyList): void;

```

##### vue.d.ts
```typescript
export * from './core';
/**
 * 将 Generator 函数包装，该函数可以作为 `watch` 的第二个参数回调函数。
 * 在开始新执行之前取消任何先前的未执行完成的流程。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @returns 返回一个函数，作为 `watch` 的回调函数。
 */
export declare function watchCallbackGeneratorWarp<T extends GeneratorFunction>(fetchGenerator: T): (val: unknown, oldVal: unknown, onCleanup: OnCleanup) => void;
/**
 * 将 Generator 函数包装，该函数可以作为 `watchEffect` 的回调函数。
 * 在开始新执行之前取消任何先前的未执行完成的流程。
 *
 * @template T - The type of the generator function.
 * @param fetchGenerator - 需要包装的 generator 函数。
 * @returns 返回一个函数，作为 `watchEffect` 的回调函数。
 */
export declare function watchEffectCallbackGeneratorWarp<T extends GeneratorFunction>(fetchGenerator: T): (onCleanup: OnCleanup) => void;

```

axiosWarp.d.ts
```typescript
/**
 * 创建带有取消请求功能的 Axios 实例
 * @param {object} originAxios - 原始的 Axios 实例
 * @param {object} config - Axios 实例的配置
 * @returns {object} - 带有取消请求功能的 Axios 实例
 */
export declare function createAxiosWithCancelRequest(originAxios: AxiosStatic, config: CreateAxiosDefaults): AxiosInstance;
```

fetchWithCancel.d.ts
```typescript
import type { PromiseWithCancel } from './core';
declare type IFetch = typeof fetch;
/**
 * 包含取消方法的 fetch 函数。返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 * @param  args - fetch 函数的参数
 * @returns {Promise<Response>} - 返回的 Promise 实例上增加 abortThisPromise 方法, 可以取消这个 Promise
 */
export declare function fetchWithCancel(...args: Parameters<IFetch>): PromiseWithCancel<Response>;
export {};

```
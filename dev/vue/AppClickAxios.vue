<script setup>
import { onMounted, ref, watch } from "vue";
import axiosO from 'axios'

const Axios = axiosO.Axios

const oldRequest = Axios.prototype.request

Axios.prototype.request = function (config) {
  const ac = new AbortController()
  const promise = oldRequest.call(this, {
    signal: ac.signal,
    ...config
  })
  promise.cancel = () => {
    ac.abort()
  }
  return promise
}
const axios = axiosO.create()

const currentIndex = ref();
const resData = ref();
const beforeData = ref();
const loading = ref(false)
const queryList = ref([
  {
    time: 1,
    data: 1,
  },
  {
    time: 2,
    data: 2,
  },
  {
    time: 3,
    data: 3,
  },
  {
    time: 0,
    data: 0,
  }
]);

watch(
  () => currentIndex.value,
  async (val, oldVal, onCleanup) => {
    const { cancel, doFetch } = runFetch(fetchAndSetData, val)
    onCleanup(cancel)
    await doFetch()
  }
);

function runFetch(fetchFunc, args) {
  const runInt = fetchFunc(args)
  let isCancel = false
  let cancelFun
  let lastNext

  function cancel() {
    isCancel = true
    cancelFun?.()
  }

  async function doFetch() {
    try {
      while(true) {
        if (isCancel) {
          runInt.return('cancel')
          break
        }
        const { value, done } = runInt.next(lastNext)
        if (value instanceof Promise) {
          if (value.cancel) {
            cancelFun = value.cancel
          }
          lastNext = await value
          // console.log('lastNext', lastNext)
        } else {
          lastNext = value
        }
        if (done) break
      }
      return lastNext
    } catch (error) {
      console.error('doFetch Error', error.name)
    }
  }
  return {
    doFetch,
    cancel
  }
}

function * fetchAndSetData(val) {
  const args = queryList.value[val]
  loading.value=true
  beforeData.value = yield* fetchDelayTime({ data: args.data + 'b', time: args.time / 2 })
  resData.value = yield* fetchDelayTime(args);
}
Promise.allWithCancel = function (...args) {
  const resPromise = Promise.all(...args)
  resPromise.cancel = () => {
    this.forEach(i => i.cancel?.())
  }
  return resPromise
}
// TODO: Promise的其他方法也需要修改。


function * fetchDelayTime({ data, time }) {
  let res = yield fetchWithCancel(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = res.data
  res = res.data
  // console.log('fetchPromise', fetchPromise, fetch2)
  return res
}

function fetchWithCancel(input, init = {}) {
  // console.log('axios', axios)
  return axios.get(input)
}

const clickFetch = warpWithCancel(fetchAndSetData)

function warpWithCancel (fun) {
  let lastCancel
  return async function (val) {
    if (lastCancel) {
      // console.log('lastCancel cancel', val)
      lastCancel()
    }
    const { cancel, doFetch } = runFetch(fun, val)
    lastCancel = cancel
    // console.log('lastCancel set', val)
    await doFetch()
  }
}

</script>

<template>
  <div>currentIndex: {{ currentIndex }}</div>
  <button
    class="btn"
    v-for="(item, index) in queryList"
    :key="index"
    @click="clickFetch(index)">
    time: {{ item.time }} data: {{ item.data }}
  </button>
  <div>beforeData: {{ beforeData }}</div>
  <div>resData: {{ resData }}</div>
  <div class="loading" >
    loading: {{ loading }}
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.btn {
  margin-left: 10px;
}
/* .loading {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background-color: #fff;
  opacity: 0.6;
  left: 0;
  top: 0;
} */
</style>

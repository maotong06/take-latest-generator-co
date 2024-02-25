<script setup>
import { ref, watch } from "vue";
const currentIndex = ref();
const resData = ref();
const beforeData = ref();
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
    while(true) {
      if (isCancel) {
        runInt.return('cancel')
        break
      }
      const { value, done } = runInt.next(lastNext)
      try{
        if (value instanceof Promise) {
          if (value?.cancel) {
            cancelFun = value.cancel
          }
          lastNext = await value
        } else {
          lastNext = value
        }
      } catch (err) {
        console.error('err', err.message, err.name)
        if (err.name === 'AbortError') {
          runInt.return('cancel')
        } else {
          runInt.throw(err)
        }
      }
      if (done) break
    }
    return lastNext
  }
  return {
    doFetch,
    cancel
  }
}

function * fetchAndSetData(val) {
  const args = queryList.value[val]
  try {
    beforeData.value = yield* fetchDelayTime({ data: args.data + 'b', time: args.time / 2 })
    console.log('fetchAndSetData before over', args.data, beforeData.value)
    let res = yield* fetchDelayTime(args);
    resData.value = res
    console.log('fetchAndSetData over', args.data, res)
    return res
  } catch (error) {
    console.error('fetchAndSetData error', args.data, error)
  } finally {
    console.log('fetchAndSetData finil', args.data)
  }
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
  res = yield res.json()
  res = res.data
  // console.log('fetchPromise', fetchPromise, fetch2)
  return res
}

function fetchWithCancel(input, init = {}) {
  const ac = new AbortController();
  const fetch2 = fetch(input, {
    signal: ac.signal,
    ...init,
  })
  fetch2.cancel = () => {
    ac.abort()
  }
  return fetch2
}

const clickFetch = warpWithCancel(fetchAndSetData)

function warpWithCancel (fun) {
  let lastCancel
  return async function (val) {
    if (lastCancel) {
      console.log('lastCancel cancel', val)
      lastCancel()
    }
    const { cancel, doFetch } = runFetch(fun, val)
    lastCancel = cancel
    console.log('lastCancel set', val)
    const clickres = await doFetch()
    console.log('clickres', clickres)
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

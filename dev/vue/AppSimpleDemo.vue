<script setup>
import { ref, watch } from "vue";
const currentIndex = ref();
const secondData = ref();
const firstData = ref();
const queryList = [
  {
    time: 1,
    data: 1,
  },
  {
    time: 2,
    data: 2,
  },
];

watch(
  () => currentIndex.value,
  (val, oldVal, onCleanup) => {
    const { cancel, doFetch } = runFetch(fetchAndSetData, val)
    onCleanup(cancel)
    doFetch()
  }
);

function runFetch(fetchFunc, args) {
  const runInt = fetchFunc(args)
  let isCancel = false
  let lastNext
  function cancel() {
    isCancel = true
  }
  async function doFetch() {
    while(true) {
      if (isCancel) {
        runInt.throw('cancel')
        break
      }
      const { value, done } = runInt.next(lastNext)
      if (value instanceof Promise) {
        lastNext = await value
      } else {
        lastNext = value
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
  const args = queryList[val]
  try {
    firstData.value = yield fetchDelayTime({ data: args.data + 'b', time: args.time / 2 })
    secondData.value = yield fetchDelayTime(args);
    return res
  } catch (error) {
  }
}

async function fetchDelayTime({ data, time }) {
  let res = await fetch(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = await res.json()
  return res.data
}

function fetchItem(index) {
  currentIndex.value = index;
}


const clickFetch = warpWithCancel(fetchAndSetData)

function warpWithCancel (fun) {
  let lastCancel
  return async function (val) {
    if (lastCancel) {
      lastCancel()
    }
    const { cancel, doFetch } = runFetch(fun, val)
    lastCancel = cancel
    let res = await doFetch()
    console.log('doFetch res', res)
  }
}

</script>

<template>
  <div>currentIndex: {{ currentIndex }}</div>
  <button
    class="btn"
    v-for="(item, index) in queryList"
    :key="index"
    @click="fetchItem(index)">
    time: {{ item.time }} data: {{ item.data }}
  </button>
  <div>firstData: {{ firstData }}</div>
  <div>secondData: {{ secondData }}</div>
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

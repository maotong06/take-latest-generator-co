<script setup>
import { ref, watch } from "vue";
import { watchCallbackGeneratorWarp, takeLatestWarp } from '../../src/vue'
import { fetchWithCancel } from '../../src/fetchWithCancel'
const currentIndex = ref();
const secData = ref();
const firstData = ref();
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
]);

watch(
  () => currentIndex.value,
  watchCallbackGeneratorWarp(fetchAndSetData)
);

function * fetchAndSetData(val) {
  const args = queryList.value[val]
  try {
    loading.value=true
    firstData.value = yield* fetchDelayTime({ data: args.data + 'f', time: args.time / 2 })
    let res = yield* fetchDelayTime(args);
    secData.value = res
    return res
  } catch (error) {
    console.error('fetchAndSetData error', error)
  }
}

function * fetchDelayTime({ data, time }) {
  let res = yield fetchWithCancel(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = yield res.json()
  res = res.data
  return res
}

function setWatchItem(index) {
  currentIndex.value = index;
}

const clickFetch = takeLatestWarp(fetchAndSetData)
</script>

<template>
  <div>currentIndex: {{ currentIndex }}</div>
  <button
    class="btn"
    v-for="(item, index) in queryList"
    :key="index"
    @click="clickFetch(index)"
    >
    time: {{ item.time }} data: {{ item.data }}
  </button>
  <div>firstData: {{ firstData }}</div>
  <div>secData: {{ secData }}</div>
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

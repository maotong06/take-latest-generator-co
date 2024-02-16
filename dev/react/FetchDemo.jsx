import { useState } from 'react'
import React from 'react'
import { fetchWithCancel } from '../../src/fetchWithCancel'
import { useCallBackTakeLatest, useEffectTakeLatest, turnToAsyncWarp } from '../../src/react'

function * fetchDelayTime({ data, time }) {
  let res = yield fetchWithCancel(`/api/delayTime?data=${data}&time=${time * 1000}`, {
    cache: "no-store",
  })
  res = yield res.json()
  res = res.data
  return res
}


function FetchDemo({ count }) {
  const [currentIndex, setCurrentIndex] = useState()
  const [clickIndex, setClickIndex] = useState()
  const [firstData, setFirstData] = useState()
  const [secData, setSecData] = useState()
  const queryList = [
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
  ]

  function * fetchAndSetData(val) {
    if (val === undefined) return
    setClickIndex(val)
    const args = queryList[val]
    const firstD = yield* fetchDelayTime({ data: args.data + 'f', time: args.time / 2 })
    setFirstData(firstD)
    let res = yield* fetchDelayTime(args);
    setSecData(res)
    return res
  }

  function * effectFetchSetData() {
    if (currentIndex === undefined) return
    const args = queryList[currentIndex]
    const firstD = yield* fetchDelayTime({ data: args.data + 'f', time: args.time / 2 })
    setFirstData(firstD)
    let res = yield* fetchDelayTime(args);
    setSecData(res)
    return res
  }

  function setIdx(index) {
    setCurrentIndex(index)
  }

  useEffectTakeLatest(effectFetchSetData, [currentIndex])

  const clickFetch = useCallBackTakeLatest(fetchAndSetData, [])

  const asyncFetch = async (val) => {
    if (val === undefined) return
    await (turnToAsyncWarp(fetchAndSetData)(val))
    console.log('asyncFetch aftre')
  }
  return (
    <div className="App">
      <div>inner count: { count }</div>
        <div>currentIndex: { currentIndex }</div>
        <div>clickIndex: { clickIndex }</div>

        {
          queryList.map((item, index) => {
            return (
              <button
                key={index}
                // onClick={() => asyncFetch(index)}
                onClick={() => clickFetch(index)}
                // onClick={() => setIdx(index)}
                >
                time: { item.time } data: { item.data }
              </button>
            )
          })
        }
        <div>firstData: { firstData }</div>
        <div>secData: { secData }</div>
    </div>
  )
}

export default FetchDemo

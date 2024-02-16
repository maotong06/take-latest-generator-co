import { useState } from 'react'
import React from 'react'
import FetchDemo from './FetchDemo'

function App() {
  const [count, setCount] = useState(0)
React.useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + 1);
      // setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  });
  
  return (
    <div className="App">
      <div>App count: { count }</div>
      <FetchDemo count={count}/>
    </div>
  )
}

export default App

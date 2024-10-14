import { lazy, startTransition, useEffect, useState } from 'react'
import './App.css'

type ScreenComponent = React.FC<any>

// Lazy load the components
const ImmersionTimeGraph = lazy<ScreenComponent>(() => import('./graphs/ImmersionTime'));

    
const componentMap: Record<string, React.LazyExoticComponent<ScreenComponent>|undefined> = {
  'immersionTime': ImmersionTimeGraph,
};


function App() {

  const [path, setPath] = useState('');

  //const [path, setPath] = useState();
  const [ScreenComponent, setScreenComponent] = useState<ScreenComponent>();

  useEffect(() => {
    setTimeout(() => {
      setScreenComponent(componentMap[(window as any).path])
    }, 100);
  }, []);
  
  return (
    <div>
      {
        ScreenComponent ?
        <ScreenComponent/> : 
        <div className='h-8 w-fit flex'>
          <input
          className='border-black border-2'
            value={path}
            onChange={(event) => {
              setPath(event.target.value);
            }}
          />
          <button className=' border-black border-2 px-5' onClick={() => {
            startTransition(() => {
              setScreenComponent(componentMap[path])

            })
          }}>Go</button>
        </div>
      }
    </div>
  )
}




export default App

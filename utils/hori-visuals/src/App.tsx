import './App.css'

function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'red',
    }} >
      {
        (window as any).myJsonData.text
      
      }
    </div>
  )
}




export default App

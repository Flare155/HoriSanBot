import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App';
import ImmersionTime from './graphs/ImmersionTime';

const router = createBrowserRouter([
  {
    path: "/immersionTime",
    element: <ImmersionTime/>,
  },
  {
    path: "/",
    element: <App/>,
  }
]);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)



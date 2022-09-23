import React, { useEffect, useReducer, useState } from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import { initialValue, reducer, StoreContext, generateProfile, types, slashtag } from './store';
import { Home } from './pages/Home.js';
import { ScanQRPage } from './pages/ScanQR';
import b4a from 'b4a'

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initialValue);

  useEffect(() => {
    (async () => {
      if (state.profile) return 

      const saved = localStorage.getItem('profile')

      let profile; 

      if (!saved) {
        profile = await generateProfile()
        localStorage.setItem('profile', JSON.stringify(profile))
      } else {
        profile = JSON.parse(saved)
      }

      const drive = slashtag.drivestore.get()
      await drive.ready()
      await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))
      console.log({drive: drive.key, version: drive.version})

      dispatch({
        type: types.SET_PROFILE,
        profile
      })
    })()
  }, [state.profile])

  return (
    <div className="App">
      <StoreContext.Provider value={{ state, dispatch }}>
        {!state.profile ? (
          <Loading />
        ) : (
          (() => {
            switch (state?.view) {
              case 'home':
                return <Home />;
              case 'qr':
                return <ScanQRPage />;
              default:
                return <Home />;
            }
          })()
        )}
      </StoreContext.Provider>
    </div>
  );
};

function Loading() {
  return (
    <div className="loading-screen">
      Setting up
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);



import { useContext, useEffect, useState } from 'react';
import { StoreContext, types } from '../store';
import { Jdenticon } from '../components/identicon.js';
import { slashtag } from '../store'

export const Template = ({ title, back = false, children = null }) => {
  const { state, dispatch } = useContext(StoreContext);

  useEffect(() => {
    if (state.profile) return;

    (async () => {
      const currentUser = await state.currentUser;
      const profile = {}

      dispatch({
        type: types.SET_PROFILE,
        profile,
      });
    })();
  }, [state.currentUser]);

  return (
    <>
      <header className="header">
        <div className="left">
          {state.profile.name}
        </div>
        <nav className="right">
          <button
            className="top-right-button"
            onClick={() => dispatch({ type: types.SET_VIEW, view: 'profile' })}
          >
            <Jdenticon
              className="image"
              value={slashtag.url}
            ></Jdenticon>
          </button>
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
};

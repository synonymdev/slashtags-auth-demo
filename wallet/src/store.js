import { createContext } from 'react';
import SDK from '@synonymdev/slashtags-sdk'
import * as falso from '@ngneat/falso';
import b4a from 'b4a'

export const initialValue = {
  profile: undefined,
  view: "home",
  accounts: [],
  viewOptions: {}
}

export const types = {
  SET_VIEW: 'SET_VIEW',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SET_PROFILE: 'SET_PROFILE',
};

const primaryKey = localStorage.getItem('primaryKey')

export const sdk = new SDK({ 
  relay: 'ws://localhost:45475',
  primaryKey: primaryKey && b4a.from(primaryKey, 'hex')
})

localStorage.setItem('primaryKey', b4a.toString(sdk.primaryKey, 'hex'))

// Default slasthag
export const slashtag = sdk.slashtag()

export const reducer = (state, action) => {
  let result = { ...state };
  switch (action.type) {
    case types.SET_VIEW:
      result = {
        ...state,
        view: action.view,
        viewOptions: action.viewOptions || {},
      };
      break;
    case types.ADD_ACCOUNT:
      result = {
        ...state,
        view: 'home',
        accounts: [
          ...state.accounts
            .map((account) => account.id !== action.account.id)
            .filter(Boolean),
          action.account,
        ],
      };
      break;
    case types.SET_PROFILE: 
      result = {
        ...state,
        profile: action.profile
      }
      break
    default:
      break;
  }

  console.log('Store update\n  ', action, '\n  ', result);
  return result;
};

export const StoreContext = createContext(initialValue);


export async function generateProfile() {
	return {
			name: falso.randFullName(),
			bio: falso.randPhrase().slice(0, 160),
			links: [
				{
					title: 'twitter',
					url: 'https://www.twitter.com/' + falso.randWord(),
				},
				{ title: 'website', url: falso.randUrl() },
			],
	};
}

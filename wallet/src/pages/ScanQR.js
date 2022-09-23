import { Template } from '../containers/Template';
import { useContext, useState } from 'react';
import { StoreContext, types } from '../store';
import { Sheet } from '../components/Sheet';
import { Card } from '../components/Card';
import { sdk } from '../store'
import b4a from 'b4a'

import { SlashURL } from '@synonymdev/slashtags-sdk';
import { Client } from '@synonymdev/slashtags-auth';

export const ScanQRPage = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [isVisible, setIsVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [url, setURL] = useState(null);

  const cancel = () => {
    setIsVisible(false);
    setProfile(null);
    setURL(null);
  };

  const submitLogin = async () => {
    const slashtag = sdk.slashtag()
    const client = new Client(slashtag)
    console.log("Authing to:", url)

    const response = await client.authz(url)
    console.log(response)
    if (response?.status === 'ok') dispatch({ type: types.ADD_ACCOUNT, account: profile })
    else if (response.message) alert ("Error:" + response.message)
    else alert ("Couldn't connect to server")
  };

  const pasteClipboard = async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      navigator.clipboard.writeText(clipboard);
      setURL(clipboard)
      console.log("Pasting:'", clipboard, "'")

      const parsed = SlashURL.parse(clipboard)
      const serverDrive = sdk.drive(parsed.key)
      await serverDrive.ready()
      const buf = await serverDrive.get('/profile.json')
      const serverProfile = buf && JSON.parse(b4a.toString(buf))

      console.log("Resolved profile:", serverProfile)
       
      setProfile({ ...serverProfile, id: parsed.id })
      setIsVisible(true)
    } catch (error) {
      alert(error.message)
    }
  };

  return (
    <Template back={true} scan={false}>
      <div className="scan-box"></div>

      <p className="paste-clipboard">
        Scan the QR code above or:{' '}
        <button onClick={pasteClipboard}>+ Paste from clipboard</button>
      </p>
      <Sheet isVisible={isVisible}>
        <div className="login-modal">
          <h1>Sign in with slashtags to</h1>
          <Card profile={profile} />
          <div className="footer">
            <button className="cancel btn" onClick={cancel}>
              Cancel
            </button>
            <button
              className="submit  btn primary"
              onClick={submitLogin}
            >
            Login
            </button>
          </div>
        </div>
      </Sheet>
    </Template>
  );
};

import {atom, RecoilRoot, selector, useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {useState, Suspense} from 'react';
import {ErrorBoundary} from "react-error-boundary";

async function myDBQuery({userID}) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: userID,
        name: `Name of ${userID}`,
        error: userID < 0 ? 'There was an error while attempting to retrieve user info.' : undefined,
      });
    }, 2000);
  });
}

// @RECOIL: Atom
const currentUserIDState = atom({
  key: 'currentUserIDState',
});

// @RECOIL: Selector
const currentUserNameQuery = selector({
  key: 'CurrentUserName',
  get: async ({get}) => {
    const response = await myDBQuery({
      userID: get(currentUserIDState)
    });

    if (response.error) {
      throw response.error;
    }

    return response.name;
  },
});

function App() {
  return (
    // @RECOIL: Wrap
    <RecoilRoot>
      <ErrorBoundary
          fallback={<div>Error!</div>}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <CurrentUserIDInput />
          <CurrentUserInfo />
        </Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>
}

function CurrentUserIDInput() {
  const [inputValue, setInputValue] = useState('');
  // @RECOIL: updater
  const setCurrentUserID = useSetRecoilState(currentUserIDState);

  const addItem = () => {
    setCurrentUserID(inputValue);
    setInputValue('');
  };

  const onChange = ({target: {value}}) => {
    setInputValue(value);
  };

  return (
    <div>
      <input type="text" value={inputValue} onChange={onChange} />
      <button onClick={addItem}>Search</button>
    </div>
  );
}

export default App;

import {atom, RecoilRoot, selector, selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {useState, Suspense} from 'react';
import {ErrorBoundary} from "react-error-boundary";

// A fake async function that returns results in 2 seconds.
// It returns an error result when the userID is less than zero.
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

// @RECOIL: Async Selector a.k.a Query
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

// @RECOIL: Query with Parameter
const userNameQuery = selectorFamily({
  key: 'UserName',
  get: userID => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }

    return response.name;
  },
})

function App() {
  return (
    // @RECOIL: Wrap
    <RecoilRoot>
      <ErrorBoundary fallback={<div>Error!</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <UserInfo userID={1} />
          <UserInfo userID={2} />
          <UserInfo userID={3} />
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

function UserInfo({userID}) {
  const userName = useRecoilValue(userNameQuery(userID));
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

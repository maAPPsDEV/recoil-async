import {
  atom,
  RecoilRoot,
  selector,
  selectorFamily, useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
  waitForAll, waitForNone
} from 'recoil';
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
        friends: [1, 2, 3, 4],
        error: userID < 0 ? 'There was an error while attempting to retrieve user info.' : undefined,
      });
    }, 2000);
  });
}

// @RECOIL: Atom
const currentUserIDState = atom({
  key: 'currentUserIDState',
  default: null,
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

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }

    return response;
  },
})

// Data-Flow Graph
// @RECOIL: Query that uses Query inside
const currentUserInfoQuery = selector({
  key: 'currentUserInfoQuery',
  get: ({get}) => get(userInfoQuery(get(currentUserIDState))),
});

const friendsInfoQuery = selector({
  key: 'friendsInfoQuery',
  get: ({get}) => {
    const {friends} = get(currentUserInfoQuery);
    // return friends.map(friendID => get(userInfoQuery(friendID)))

    // Concurrent Requests with waitForAll
    return get(waitForAll(
        friends.map(friendID =>  userInfoQuery(friendID))
    ));

    // Concurrent Request with waitForNone
    // const friendLoadables = get(waitForNone(
    //     friends.map(friendID =>  userInfoQuery(friendID))
    // ));
    // return friendLoadables
    //     .filter(({state}) => state === 'hasValue')
    //     .map(({contents}) => contents);
  },
});

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
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);
  const setCurrentUserID = useSetRecoilState(currentUserIDState);
  // const userName = useRecoilValue(currentUserNameQuery);

  // Pre-Fetching
  const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
    snapshot.getLoadable(userInfoQuery(userID)); // pre-fetch user info
    set(currentUserIDState, userID);
  });

  return (
      <div>
        <h1>{currentUser.name}</h1>
        <ul>
          {friends.map(friend =>
              <li key={friend.id} onClick={() => {
                setCurrentUserID(friend.id)
                // changeUser(friends.id);
              }}>
                {friend.name}
              </li>
          )}
        </ul>
      </div>
  )
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

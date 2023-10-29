import React, { useState, useRef } from 'react';
import { useSSRComputation } from '@shakacode/use-ssr-computation.macro';
import {setErrorHandler} from "@shakacode/use-ssr-computation.runtime";

setErrorHandler((error) => {
  console.error('SSR Error', error);
});

const ApolloGraphQL = () => {
  const [userId, setUserId] = useState(1);
  const [newName, setNewName] = useState<string>();
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const data = useSSRComputation('../ssr-computations/userQuery.ssr-computation', [userId], {});
  const { loading: updating, error: updateError } = useSSRComputation('../ssr-computations/updateUser.ssr-computation', [userId, newName || ''], {
    skip: (newName === undefined),
  }) || {};

  const renderUserInfo = () => {
    if (!data) {
      return <div>Loading...</div>;
    }
    const { name, email } = data.user;
    return (
      <p>
        <b>{name}: </b>
        {email}
      </p>
    );
  };

  const changeUser = () => {
    setUserId(prevState => prevState === 1 ? 2 : 1);
    setNewName(undefined);
  };

  const updateUser = () => {
    setNewName(newNameInputRef.current?.value);
  };

  const { name, email } = data || {};
  return (
    <div>
      { renderUserInfo() }
      <button onClick={changeUser}>Change User</button>
      <br />
      <br />
      <div><b>Update User</b></div>
      <label>New User Name: </label>
      <input type="text" ref={newNameInputRef} />
      <br />
      <button onClick={updateUser}>Update User</button>

      { updating && <div>Updating...</div> }
      { updateError && <div style={{ color: 'red' }}>Error while updating User: {updateError.message}</div> }
    </div>
  );
};

export default ApolloGraphQL;

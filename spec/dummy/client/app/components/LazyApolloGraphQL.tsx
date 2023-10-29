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
  const { loading, error } = useSSRComputation('../ssr-computations/updateUser.ssr-computation', [userId, newName || ''], {
    skip: (newName === undefined),
  }) || {};
  if (!data) {
    return <div>Loading...</div>;
  }
  if (loading) {
    return <div>Updating...</div>;
  }
  if (error) {
    return <div>Error while updating User: {error.message}</div>;
  }
  const { name, email } = data.user;
  return (
    <div>
      <p>
        <b>{name}: </b>
        {email}
      </p>
      <button onClick={() => {
        setUserId(prevState => prevState === 1 ? 2 : 1);
        setNewName(undefined);
      }}>
        Change User
      </button>

      <input type="text" ref={newNameInputRef} />
      <button onClick={() => {
        setNewName(newNameInputRef.current?.value);
      }}>
        Update User
      </button>
    </div>
  );
};

export default ApolloGraphQL;

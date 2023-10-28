import React, { useState } from 'react';
import { useSSRComputation } from '@shakacode/use-ssr-computation.macro';

const ApolloGraphQL = () => {
  const [userId, setUserId] = useState(1);
  const data = useSSRComputation('../ssr-computations/userQuery.ssr-computation', [userId], {});
  if (!data) {
    return(
      <div>
        <div>Loading...</div>
        <button onClick={() => setUserId(prevState => prevState === 1 ? 2 : 1)}>
          Change User
        </button>
      </div>
    );
  }
  const { name, email } = data.user;
  return (
    <div>
      <p>
        <b>{name}: </b>
        {email}
      </p>
      <button onClick={() => setUserId(prevState => prevState === 1 ? 2 : 1)}>
        Change User
      </button>
    </div>
  );
};

export default ApolloGraphQL;

import React from 'react';
import { useSSRComputation } from '@shakacode/use-ssr-computation.macro';

const ApolloGraphQL = () => {
  const data = useSSRComputation('../ssr-computations/userQuery.ssr-computation', [1], {});
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

export default ApolloGraphQL;

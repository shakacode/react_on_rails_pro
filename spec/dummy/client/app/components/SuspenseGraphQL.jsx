import React from 'react';

import { gql, useQuery } from '@apollo/client';

const GET_FIRST_USER = gql`
  query FirstUser {
    user(id: 1) {
      name
      email
    }
  }
`;

const SuspenseGraphQL = () => {
  const { data } = useQuery(GET_FIRST_USER);
  return <div style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>
    {/* <b>{data.name}</b>
    <span>{data.name}</span> */}
  </div>;
};

export default SuspenseGraphQL;

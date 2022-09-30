import React, { useState, useContext } from 'react';

import { gql, useQuery } from '@apollo/client';

const GET_FIRST_USER = gql`
  query FirstUser {
    user(id: 1) {
      name
      email
    }
  }
`;

export const Context = React.createContext(1);
const Internal = () => {
  // const { data } = useQuery(GET_FIRST_USER, { ssr: false });
  return <div style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>
    {/* <b>{data.name}</b>
    <span>{data.name}</span> */}
  </div>;
};

const SuspenseGraphQL = () => {
  // return <Internal />;
  const [value] = useState(12);
  // const value = useContext(Context);
    return value;
};

export default SuspenseGraphQL;

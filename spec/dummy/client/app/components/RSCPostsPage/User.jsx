import React from 'react';
import fetch from 'node-fetch';

const User = async ({ userId }) => {
  const user = await (await fetch(`https://jsonplaceholder.org/users/${userId}`)).json();
  const fullName = `${user.firstname} ${user.lastname}`;

  return (
    <p>
      By <span style={{ fontWeight: 'bold' }}>{fullName}</span>
    </p>
  );
};

export default User;

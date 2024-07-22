"use client";

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
// import RailsContext from '../components/RailsContext';
import css from '../components/HelloWorld.module.scss';

const HelloWorld = ({ helloWorldData, railsContext }) => {
  const [name, setName] = useState(helloWorldData.name);
  const nameDomRef = useRef(null);

  const handleChange = () => {
    setName(nameDomRef.current.value);
  };

  console.log(
    'HelloWorld demonstrating a call to console.log in ' +
      'spec/dummy/client/app/components/HelloWorld.jsx:18',
  );

  return (
    <div>
      <h3 className={css.brightColor}>Hello, {name}!</h3>
      <p>
        Say hello to:
        <input type="text" ref={nameDomRef} defaultValue={name} onChange={handleChange} />
      </p>
      {/* {railsContext && <RailsContext {...{ railsContext }} />} */}
    </div>
  );
};

HelloWorld.propTypes = {
  helloWorldData: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  railsContext: PropTypes.object,
};

export default HelloWorld;

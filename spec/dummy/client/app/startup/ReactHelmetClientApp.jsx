// Top level component for simple client side only rendering
import React from 'react';
import ReactHelmet from '../components/ReactHelmet';

export default (props, _railsContext) => () => <ReactHelmet {...props} serverResponse={"API requests during server rendering work!"} />;

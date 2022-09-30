import React, { useContext } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import { hydrateRoot } from "react-dom/client";
import SuspenseGraphQL from "../components/SuspenseGraphQL";

export default (props, _railsContext, domNodeId) => {
    const client = new ApolloClient({
        cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
        link: {
            uri: 'http://localhost:3000/graphql',
            credentials: 'same-origin',
            headers: {
            },
        },
        ssrForceFetchDelay: 100, // in milliseconds
    });
    const el = document.getElementById(domNodeId);
    hydrateRoot(el, <ApolloProvider client={client}><SuspenseGraphQL /></ApolloProvider>);
}

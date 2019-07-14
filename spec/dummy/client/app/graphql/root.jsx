import React from 'react';
import gql from "graphql-tag";
import { Query } from "react-apollo";

const GET_HN = gql`
{
  hn {
    topStories {
      title
      id
      score
      descendants
    }
  }
}`;

const GET_GIPHY = gql`
{
  giphy {
		random(tag:"javascript") {
    	id
      url
      images {
        original {
          url
        }
      }
  	}
  }
}`;

const Root = () => (
  <div id="graphql-should-be-here">
    <Query query={GET_HN}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error! ${error.message}`;

        return <div>{JSON.stringify(data)}</div>;
      }}
    </Query>
    <Query query={GET_GIPHY}>
      {({ loading, error, data }) => {
        if (loading) return "Loading...";
        if (error) return `Error! ${error.message}`;

        return <div>{JSON.stringify(data)}</div>;
      }}
    </Query>
  </div>
);

export default Root;

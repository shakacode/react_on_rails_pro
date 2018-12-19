// Based on example from https://codesandbox.io/s/p5n69p23x0

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider, Client } from 'urql';
import { Connect, query } from 'urql';

import { query } from 'urql';

const client = new Client({
  url: 'https://www.graphqlhub.com/graphql',
});

export const UrqlApp = () => (
  <Provider client={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));

const topStoriesQuery = `
    {
      hn {
        topStories {
          title
          id
          score
          descendants
        }
      }
    }
    `;

const Home = () => (
  <Connect query={query(topStoriesQuery)}>
    {({ loaded, fetching, refetch, data, error, addTodo }) => {}}
  </Connect>
);

export default class UrqlApp extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { data: {}, error: undefined };
  }

  componentDidMount() {
    request
      .get('https://www.graphqlhub.com/graphql', {
        method: 'get',
        params: {
          query: this.query,
        },
      })
      .then(res => this.setState({ data: res.data }))
      .catch(error => this.setState({ error: error }));
  }

  render() {
    const { data } = this.state.data;
    if (!data) {
      return <h2>Loading...</h2>;
    }

    const { topStories } = data.hn;
    const { error } = this.state;
    return error ? (
      <h2>Error: {error}</h2>
    ) : (
      <div>
        <h2>Hacker News front page</h2>
        <ol>
          {topStories.map(story => (
            <li key={story.id}>
              <a href={`https://news.ycombinator.com/item?id=${story.id}`}>{story.title}</a>
              &#x2B50; {story.score} &#128172; {story.descendants}
            </li>
          ))}
        </ol>
      </div>
    );
  }
}

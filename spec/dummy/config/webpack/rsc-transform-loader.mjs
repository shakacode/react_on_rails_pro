import { load } from 'react-server-dom-webpack/node-loader';
import { pathToFileURL } from 'url';

export default function (source, sourceMap) {
  const callback = this.async();
  const fileUrl = pathToFileURL(this.resourcePath).href;
  
  load(fileUrl, null, async () => {
    return {
      format: 'module',
      source,
    }
  }).then(result => {
    return callback(null, result.source, sourceMap);
  });
}

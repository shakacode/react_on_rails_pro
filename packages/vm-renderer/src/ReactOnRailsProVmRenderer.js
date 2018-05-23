
import cluster from 'cluster';
import master from './master';
import worker from './worker';

export default function reactOnRailsProRenderer(config = {}) {
  if (cluster.isMaster) {
    master(config);
  } else {
    worker(config);
  }
}

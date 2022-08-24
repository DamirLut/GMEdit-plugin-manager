const host = 'http://localhost:9000';

export async function getRepo(owner, repo, date) {
  return fetch(host + '/github/' + owner + '/' + repo + '/' + date).then((res) => res.json());
}

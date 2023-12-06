import logging
import os
import requests
from datetime import datetime, timedelta
from urllib.parse import urlparse


class Repository(dict):
    _props = ['archived', 'description', 'forks_count', 'stargazers_count',
              'open_issues_count', ]

    def __init__(self, uri, gh_token=None):
        super().__init__()
        self.uri = urlparse(f'https://{uri}')
        self.gh_token = gh_token
        self.owner, self.name = os.path.split(self.uri.path)
        self.owner = self.owner[1:]
        for prop in self._props:
            self[prop] = None
        self._get_gh_stats()

    def _get_gh_stats(self) -> None:
        if self.uri.netloc != 'github.com':
            logging.warning(
                f'Unknown repository provider {self.uri.netloc} - skipping stats.')
            return
        if not self.gh_token:
            logging.warning(
                f'No PRIVATE_ACCESS_TOKEN for {self.uri.netloc} - skipping stats.')
            return
        r = requests.get(
            f'https://api.github.com/repos/{self.owner}/{self.name}',
            headers={
                'Authorization': f'token {self.gh_token}'
            })
        j = r.json()
        for prop in self:
            p = j.get(prop)
            if p and (type(p) != str or len(p) > 0):
                self[prop] = p
        license = j.get('license')
        if license and license.get('key') != 'other':
            self['license'] = license.get('spdx_id')
        p = j.get('pushed_at')
        if p:
            fmt = '%Y-%m-%dT%H:%M:%SZ'
            d = datetime.strptime(p, fmt)
            self['pushed_at'] = d.timestamp()
            self['active'] = d > (datetime.now() - timedelta(days=30*6))

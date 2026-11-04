"""Jedis bridge for live_clients.py. Needs Java 17+ and Maven, and network access to Maven Central."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

KEY = 'jedis'
VERSION = '8.0.2'
HERE = Path(__file__).parent

POM = '''<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion>
<groupId>x</groupId><artifactId>probe</artifactId><version>1</version>
<dependencies><dependency><groupId>redis.clients</groupId><artifactId>jedis</artifactId><version>{v}</version></dependency></dependencies></project>
'''


def prepare(version, cache):
    d = Path(cache) / 'bridges' / f'jedis-{version}'
    d.mkdir(parents=True, exist_ok=True)
    env = {'JAVA_HOME': ''}  # a stale JAVA_HOME breaks mvn on this setup; use the java on the PATH
    cp = d / 'cp.txt'
    if not cp.exists():
        (d / 'pom.xml').write_text(POM.format(v=version))
        sh('mvn', '-q', '-B', 'dependency:build-classpath', f'-Dmdep.outputFile={cp}', cwd=d, env=env)
    for f in ('Probe.java',):
        (d / f).write_text((HERE / f).read_text())
    sh('javac', '-cp', cp.read_text().strip(), 'Probe.java', cwd=d, env=env)
    classpath = f'{cp.read_text().strip()}:{d}'

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['java', '-cp', classpath, 'Probe', str(port), user, password, mode, *payload],
                             capture_output=True, text=True, timeout=60, env={**os.environ, 'JAVA_HOME': ''})
        return parse(out.stdout, out.stderr)
    return run

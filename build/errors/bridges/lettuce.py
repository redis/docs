"""Lettuce bridges for live_clients.py. Needs Java 17+ and Maven, and network access to Maven Central.

The sync, async and reactive APIs are one library, so lettuce_sync.py, lettuce_async.py and
lettuce_reactive.py share this code and differ only in the API that the probe calls."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

HERE = Path(__file__).parent
VERSION = '7.9.0.RELEASE'

POM = '''<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion>
<groupId>x</groupId><artifactId>probe</artifactId><version>1</version>
<dependencies><dependency><groupId>io.lettuce</groupId><artifactId>lettuce-core</artifactId><version>{v}</version></dependency></dependencies></project>
'''


def prepare_api(api, version, cache):
    d = Path(cache) / 'bridges' / f'lettuce-{version}'
    d.mkdir(parents=True, exist_ok=True)
    env = {'JAVA_HOME': ''}
    cp = d / 'cp.txt'
    if not cp.exists():
        (d / 'pom.xml').write_text(POM.format(v=version))
        sh('mvn', '-q', '-B', 'dependency:build-classpath', f'-Dmdep.outputFile={cp}', cwd=d, env=env)
    (d / 'LettuceProbe.java').write_text((HERE / 'LettuceProbe.java').read_text())
    sh('javac', '-cp', cp.read_text().strip(), 'LettuceProbe.java', cwd=d, env=env)
    classpath = f'{cp.read_text().strip()}:{d}'

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['java', '-cp', classpath, 'LettuceProbe', api, str(port), user, password, mode, *payload],
                             capture_output=True, text=True, timeout=60, env={**os.environ, 'JAVA_HOME': ''})
        return parse(out.stdout, out.stderr)
    return run

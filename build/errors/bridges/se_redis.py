"""StackExchange.Redis bridges for live_clients.py (NRedisStack builds on this library).
Needs the .NET 9 SDK, and network access to NuGet. se_redis_sync.py and se_redis_async.py share this code."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

HERE = Path(__file__).parent
VERSION = '3.0.0'

CSPROJ = '''<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net9.0</TargetFramework>
<ImplicitUsings>enable</ImplicitUsings><Nullable>disable</Nullable><AssemblyName>probe</AssemblyName></PropertyGroup>
<ItemGroup><PackageReference Include="StackExchange.Redis" Version="{v}" /></ItemGroup></Project>
'''


def prepare_api(api, version, cache):
    d = Path(cache) / 'bridges' / f'se-redis-{version}'
    d.mkdir(parents=True, exist_ok=True)
    (d / 'probe.csproj').write_text(CSPROJ.format(v=version))
    (d / 'Program.cs').write_text((HERE / 'SeRedisProbe.cs').read_text())
    env = {'DOTNET_CLI_TELEMETRY_OPTOUT': '1', 'DOTNET_NOLOGO': '1'}
    sh('dotnet', 'build', '-c', 'Release', '-o', 'out', '--nologo', '-v', 'q', cwd=d, env=env)

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['dotnet', 'out/probe.dll', api, str(port), user, password, mode, *payload], cwd=d,
                             capture_output=True, text=True, timeout=60, env={**os.environ, **env})
        return parse(out.stdout, out.stderr)
    return run

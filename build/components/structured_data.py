import io
import json
import os
import pytoml
import yaml
from typing import Any


class StructuredData:
    PARSERS = {
        '.json': {
            'dump': lambda x, y: json.dump(x, y, indent=4),
            'dumps': lambda x: json.dumps(x, indent=4),
            'load': lambda x: json.load(x),
            'loads': lambda x: json.loads(x),
        },
        '.yaml': {
            'dump': lambda x, y: yaml.dump(x, y),
            'dumps': lambda x: yaml.dump(x),
            'load': lambda x: yaml.load(x, Loader=yaml.FullLoader),
            'loads': lambda x: yaml.load(io.StringIO(x), Loader=yaml.FullLoader),
        },
        '.toml': {
            'dump': lambda x, y: pytoml.dump(x, y),
            'dumps': lambda x: pytoml.dumps(x),
            'load': lambda x: pytoml.load(x),
            'loads': lambda x: pytoml.loads(x),
        },
    }

    def __init__(self):
        pass

    @staticmethod
    def dump(ext: str, d: dict, f: Any) -> None:
        if ext in StructuredData.PARSERS:
            return StructuredData.PARSERS.get(ext).get('dump')(d, f)
        else:
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def dumps(ext: str, d: dict) -> None:
        if ext in StructuredData.PARSERS:
            return StructuredData.PARSERS.get(ext).get('dumps')(d)
        else:
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def load(ext: str, f: Any) -> dict:
        if ext in StructuredData.PARSERS:
            return StructuredData.PARSERS.get(ext).get('load')(f)
        else:
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def loads(ext: str, s: str) -> dict:
        if ext in StructuredData.PARSERS:
            return StructuredData.PARSERS.get(ext).get('loads')(s)
        else:
            raise RuntimeError(f'unknown extension {ext}')


def load_dict(filepath: str) -> dict:
    # _, name = os.path.split(filepath)
    _, ext = os.path.splitext(filepath)
    with open(filepath, 'r') as f:
        o = StructuredData.load(ext, f)
    return o


def dump_dict(filepath: str, d: dict) -> None:
    _, ext = os.path.splitext(filepath)
    with open(filepath, 'w') as f:
        StructuredData.dump(ext, d, f)

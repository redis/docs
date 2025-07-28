import io
import json
import logging
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
        logging.debug("ENTERING: ")
        pass
        logging.debug("EXITING: ")

    @staticmethod
    def dump(ext: str, d: dict, f: Any) -> None:
        logging.debug("ENTERING: ")
        if ext in StructuredData.PARSERS:
            result = StructuredData.PARSERS.get(ext).get('dump')(d, f)
            logging.debug("EXITING: ")
            return result
        else:
            logging.debug("EXITING: ")
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def dumps(ext: str, d: dict) -> None:
        logging.debug("ENTERING: ")
        if ext in StructuredData.PARSERS:
            result = StructuredData.PARSERS.get(ext).get('dumps')(d)
            logging.debug("EXITING: ")
            return result
        else:
            logging.debug("EXITING: ")
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def load(ext: str, f: Any) -> dict:
        logging.debug("ENTERING: ")
        if ext in StructuredData.PARSERS:
            result = StructuredData.PARSERS.get(ext).get('load')(f)
            logging.debug("EXITING: ")
            return result
        else:
            logging.debug("EXITING: ")
            raise RuntimeError(f'unknown extension {ext}')

    @staticmethod
    def loads(ext: str, s: str) -> dict:
        logging.debug("ENTERING: ")
        if ext in StructuredData.PARSERS:
            result = StructuredData.PARSERS.get(ext).get('loads')(s)
            logging.debug("EXITING: ")
            return result
        else:
            logging.debug("EXITING: ")
            raise RuntimeError(f'unknown extension {ext}')


def load_dict(filepath: str) -> dict:
    logging.debug("ENTERING: ")
    # _, name = os.path.split(filepath)
    _, ext = os.path.splitext(filepath)
    with open(filepath, 'r') as f:
        o = StructuredData.load(ext, f)
    logging.debug("EXITING: ")
    return o


def dump_dict(filepath: str, d: dict) -> None:
    logging.debug("ENTERING: ")
    _, ext = os.path.splitext(filepath)
    with open(filepath, 'w') as f:
        StructuredData.dump(ext, d, f)
    logging.debug("EXITING: ")

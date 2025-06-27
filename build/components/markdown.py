import logging
import os
from .structured_data import StructuredData
from .util import die


class Markdown:
    FM_TYPES = {
        '{\n': {
            'eof': '}\n',
            'ext': '.json'
        },
        '---\n': {
            'eof': '---\n',
            'ext': '.yaml'
        },
        '+++\n': {
            'eof': '+++\n',
            'ext': '.toml'
        }
    }

    def __init__(self, filepath: str, warnings: bool = False):
        logging.debug("ENTERING: ")
        self.filepath = filepath
        self.warnings = warnings
        self.fm_data = dict()
        self.fm_type = self.FM_TYPES.get('---\n')
        self.fm_ext = self.fm_type.get('ext')
        self.payload = ''
        if not self.filepath or not os.path.exists(self.filepath):
            logging.debug("EXITING: ")
            return
        with open(self.filepath, 'r') as f:
            payload = f.readlines()
        if len(payload) == 0:
            self.fm_type = self.FM_TYPES.get('---\n')
            self.fm_ext = self.fm_type.get('ext')
            logging.debug("EXITING: ")
            return
        i = 0
        while i < len(payload):
            if payload[i].startswith('\ufeff'):  # BOM workaround
                payload[i] = payload[i][1:]
            if payload[i].strip() == '':         # Munch newlines and whitespaces
                i += 1
            else:
                self.fm_type = self.FM_TYPES.get(payload[i])
                break

        if not self.fm_type:
            self.payload = ''.join(payload)
            self.fm_type = self.FM_TYPES.get('---\n')
            self.fm_ext = self.fm_type.get('ext')
            logging.debug("EXITING: ")
            return
        eof, self.fm_ext = self.fm_type.get('eof'), self.fm_type.get('ext')
        found = False
        for j in range(i+1, len(payload)):
            if payload[j] == eof:
                found = True
                break
        if not found and payload[j].strip() != eof.strip():
            die(f'No EOF for frontmatter: {payload}')
        if self.fm_ext == '.json':
            self.fm_data.update(StructuredData.loads(
                self.fm_ext, ''.join(payload[i:j+1])))
            self.payload = ''.join(payload[j+1:])
        else:
            self.fm_data.update(StructuredData.loads(
                self.fm_ext, ''.join(payload[i+1:j])))
            self.payload = ''.join(payload[j+1:])
        logging.debug("EXITING: ")

    def persist(self) -> None:
        logging.debug("ENTERING: ")
        payload = self.payload
        if self.fm_type:
            fm = StructuredData.dumps(self.fm_ext, self.fm_data)
            if self.fm_ext != '.json':
                fm = f'{self.fm_type.get("eof")}{fm}{self.fm_type.get("eof")}'
            else:
                fm += '\n'
            payload = fm + payload
        else:
            if self.warnings:
                logging.warning(
                    f'{self.filepath} has no FrontMatter attached - please make a corrective move ASAP!')

        with open(self.filepath, 'w') as f:
            f.write(payload)
        logging.debug("EXITING: ")

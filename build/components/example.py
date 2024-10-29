import logging
import re

HIDE_START = 'HIDE_START'
HIDE_END = 'HIDE_END'
REMOVE_START = 'REMOVE_START'
REMOVE_END = 'REMOVE_END'
STEP_START = 'STEP_START'
STEP_END = 'STEP_END'
EXAMPLE = 'EXAMPLE:'
GO_OUTPUT = 'Output:'
TEST_MARKER = {
    'java': '@Test',
    'c#': '\[Fact\]'
}
PREFIXES = {
    'python': '#',
    'node.js': '//',
    'java': '//',
    'go': '//',
    'c#': '//',
    'redisvl': '#'
}

class Example(object):
    language = None
    path = None
    content = None
    hidden = None
    highlight = None
    named_steps = None

    def __init__(self, language: str, path: str) -> None:
        if not PREFIXES.get(language.lower()):
            logging.error(f'Unknown language "{language}" for example {path}')
            return
        self.language = language.lower()
        self.path = path
        with open(path, 'r') as f:
            self.content = f.readlines()
        self.hidden = []
        self.highlight = []
        self.named_steps = {}
        self.make_ranges()
        self.persist(self.path)

    def persist(self, path: str = None) -> None:
        if not path:
            path = self.path
        with open(path,'w') as f:
            f.writelines(self.content)

    def make_ranges(self) -> None:
        curr = 0
        highlight = 1
        hidden = None
        remove = False
        output = False
        step_start = None
        step_name = None
        content = []
        hstart = re.compile(f'{PREFIXES[self.language]}\\s?{HIDE_START}')
        hend = re.compile(f'{PREFIXES[self.language]}\\s?{HIDE_END}')
        sstart = re.compile(f'{PREFIXES[self.language]}\\s?{STEP_START}')
        send = re.compile(f'{PREFIXES[self.language]}\\s?{STEP_END}')
        rstart = re.compile(f'{PREFIXES[self.language]}\\s?{REMOVE_START}')
        rend = re.compile(f'{PREFIXES[self.language]}\\s?{REMOVE_END}')
        exid = re.compile(f'{PREFIXES[self.language]}\\s?{EXAMPLE}')
        go_output = re.compile(f'{PREFIXES[self.language]}\\s?{GO_OUTPUT}')
        go_comment = re.compile(f'{PREFIXES[self.language]}')
        test_marker = re.compile(f'{TEST_MARKER.get(self.language)}')

        while curr < len(self.content):
            l = self.content[curr]

            if re.search(hstart, l):
                if hidden is not None:
                    logging.error(f'Nested hidden anchor in {self.path}:L{curr+1} - aborting.')
                    return
                if highlight < curr:
                    self.highlight.append(f'{highlight}-{len(content)}')
                hidden = len(content)
                output = False
            elif re.search(hend, l):
                if hidden is None:
                    logging.error(f'Closing hidden anchor w/o a start in {self.path}:L{curr+1} - aborting.')
                    return
                if len(content) - hidden == 1:
                    self.hidden.append(f'{hidden+1}')
                else:
                    self.hidden.append(f'{hidden+1}-{len(content)}')
                highlight = len(content) + 1
                hidden = None
                output = False
            elif re.search(rstart, l):
                if remove:
                    logging.error(f'Nested remove anchor in {self.path}:L{curr+1} - aborting.')
                    return
                remove = True
                output = False
            elif re.search(rend, l):
                if not remove:
                    logging.error(f'Closing remove anchor w/o a start in {self.path}:L{curr+1} - aborting.')
                    return
                remove = False
                output = False
            elif re.search(sstart, l):
                if step_start:
                    logging.error(f'Nested step anchor in {self.path}:L{curr + 1} - aborting.')
                    return
                step_start = len(content) + 1
                try:
                    step_name = l.split(STEP_START)[1].strip().lower()
                except IndexError:
                    step_name = None
            elif re.search(send, l):
                if not step_start:
                    logging.error(f'Closing step anchor w/o a start in {self.path}:L{curr + 1} - aborting.')
                    return

                if step_name in self.named_steps:
                    logging.error(f'Duplicate step name "{step_name}" in {self.path}:L{curr + 1} - aborting.')
                    return

                self.named_steps[step_name] = f'{step_start}-{len(content)}'
                step_start = None
                step_name = None
            elif re.search(exid, l):
                output = False
                pass
            elif self.language == "go" and re.search(go_output, l):
                if output:
                    logging.error("Nested Go Output anchor in {self.path}:L{curr+1} - aborting.")
                    return
                output = True
            elif self.language == "go" and re.search(go_comment, l) and output:
                pass
            elif self.language in TEST_MARKER.keys() and re.search(test_marker, l): # Removes "[Fact]" from CSharp files and "@Test" from Java files
                pass
            else:
                output = False
                if not remove:
                    content.append(l)

            curr += 1

        if hidden is not None:
            logging.error(f'Unclosed hidden anchor in {self.path}:L{hidden+1} - aborting.')
            return
        if highlight < len(content):
            self.highlight.append(f'{highlight}-{len(content)}')

        self.content = content

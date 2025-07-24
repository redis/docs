import argparse
from datetime import datetime
import logging
import tempfile

from components.component import All
from components.util import mkdir_p


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Builds a stack website')
    parser.add_argument('--stack', type=str,
                        default='./data/components/index.json',
                        help='path to stack definition')
    parser.add_argument('--skip-clone', action='store_true',
                        help='skips `git clone`')
    parser.add_argument('--loglevel', type=str,
                        default='INFO',
                        help='Python logging level (overwrites LOGLEVEL env var)')
    parser.add_argument('--tempdir', type=str,
                        help='temporary path', default=f'{tempfile.gettempdir()}')
    parser.add_argument('--module', type=str,
                        default='*',
                        help='builds a single module (implies core docs and assets)')
    return parser.parse_args()


if __name__ == '__main__':
    # Init
    ARGS = parse_args()
    mkdir_p(ARGS.tempdir)

    # Configure logging BEFORE creating objects
    log_level = getattr(logging, ARGS.loglevel.upper())
    logging.basicConfig(
        level=log_level,
        format='%(message)s %(filename)s:%(lineno)d - %(funcName)s',
        force=True  # Force reconfiguration in case logging was already configured
    )

    # Load settings
    ALL = All(ARGS.stack, None, ARGS.__dict__)

    # Make the stack
    print(f'Applying all configured components"{ALL._name}"')
    start = datetime.now()
    ALL.apply()
    total = datetime.now() - start
    print(f'+OK ({total.microseconds / 1000} ms)')

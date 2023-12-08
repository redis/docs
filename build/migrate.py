import shutil
import os
import tempfile
import sys
import logging
from components.component import All
from components.util import mkdir_p


def parent_dir(dir):
    return os.path.dirname(dir)

def slash(dir1, dir2):
    return os.path.join(dir1, dir2)

def delete_folder(folder_path):
    shutil.rmtree(folder_path)

def copy_files(src_folder, dest_folder):

    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)

    for root, dirs, files in os.walk(src_folder):
        for file in files:
            src_path = os.path.join(root, file)
            dest_path = os.path.join(dest_folder, os.path.relpath(src_path, src_folder))
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(src_path, dest_path)

if __name__ == "__main__":
    # The working directory is the parent folder of the directory of this script
    print("## Setting the migration environment ...")
    WOKR_DIR = parent_dir(parent_dir(os.path.abspath(__file__)))
    DATA_ROOT = slash(WOKR_DIR, 'data/')
    DOCS_ROOT = slash(WOKR_DIR, 'content/')
    DOC_SRC_TMP=slash(DOCS_ROOT, 'tmp/')
    DOCS_SRC_DOCS=slash(DOC_SRC_TMP, 'docs/')
    DOCS_SRC_CMD=slash(DOC_SRC_TMP, 'commands/')
    
    print("DOC_SRC_TMP = {}".format(DOC_SRC_TMP))
    print("DOCS_SRC_DOCS = {}".format(DOCS_SRC_DOCS))
    print("DOCS_SRC_CMD = {}".format(DOCS_SRC_CMD))
    
    print("## Fetching temporary development documentation content ...")
    comp_args = {
        'stack': str(slash(DATA_ROOT, 'components/index_migrate.json')),
        'skip-clone': False,
        'loglevel': 'INFO',
        'tempdir': f'{tempfile.gettempdir()}',
        'module' : '*'
    }

    #ALL = All(comp_args.get('stack'), None, comp_args)
    #logging.basicConfig(level=comp_args.get('loglevel'), format=f'{sys.argv[0]}: %(levelname)s %(asctime)s %(message)s')
    #ALL.apply()

    DOCS_DEV=slash(DOCS_ROOT, 'develop/')
    DOCS_CMD=slash(DOCS_ROOT, 'commands/')
    print("## Migrating developer documentation to {} ...".format(DOCS_DEV))
    copy_files(DOCS_SRC_CMD, DOCS_CMD)

    dev_content = ['get-started', 'connect', 'data-types', 'interact', 'manual', 'reference']

    for topic in dev_content:
        source = slash(DOCS_SRC_DOCS, topic)
        target = slash(DOCS_DEV, topic) 
        copy_files(source, target)

    excluded_content = ['reference/signals.md', 'reference/cluster-spec.md', 'reference/arm.md', 'reference/internals']

    for sub_topic in excluded_content:
        if sub_topic.endswith('.md'):
            os.remove(slash(DOCS_DEV, sub_topic))
        else:
            delete_folder(slash(DOCS_DEV, sub_topic))

    #TODO: Rewrite the links

import shutil
import os
import re
import fnmatch
import tempfile
import yaml
import sys
import logging
from git import Repo
from components.component import All
from components.util import mkdir_p


'''
Set the migration environment
'''
def set_env():
    print("## Setting the migration environment ...")
    globals()['WORK_DIR'] = parent_dir(parent_dir(os.path.abspath(__file__)))
    globals()['DATA_ROOT'] = slash(WORK_DIR, 'data/')
    globals()['DOCS_ROOT'] = slash(WORK_DIR, 'content/')
    globals()['STATIC_ROOT'] = slash(WORK_DIR, 'static/')
    globals()['DOC_SRC_TMP'] = slash(DOCS_ROOT, 'tmp/')
    globals()['DOCS_SRC_DOCS'] = slash(DOC_SRC_TMP, 'docs/')
    globals()['DOCS_SRC_CMD'] = slash(DOC_SRC_TMP, 'commands/')
    globals()['DOCS_CMD'] = slash(DOCS_ROOT, 'commands/')
    globals()['DOCS_DEV'] = slash(DOCS_ROOT, 'develop/')
    globals()['DOCS_OPS'] = slash(DOCS_ROOT, 'operate/')
    globals()['TMP'] = '/tmp'

    return globals()
    

'''
Get the parent directory
'''
def parent_dir(dir):
    return os.path.dirname(dir)

'''
Make a folder
'''
def mkdir(dir):
    return os.makedirs(dir, exist_ok=True)


'''
Creates an _index.md file in a specific folder
'''
def create_index_file(folder_path, title, desc):
    tmpl = '''---
title: {}
description: {}
---'''

    contents = tmpl.format(title, desc)
    with open(slash(folder_path, '_index.md'), 'w', encoding='utf-8') as file:
        file.write(contents)



'''
Concatenate two paths
'''
def slash(dir1, dir2):
    return os.path.join(dir1, dir2)

'''
Delete a folder
'''
def delete_folder(folder_path):
    shutil.rmtree(folder_path)

'''
Copy files recursively
'''
def copy_files(src_folder, dest_folder):

    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)

    for root, dirs, files in os.walk(src_folder):
        for file in files:
            src_path = os.path.join(root, file)
            dest_path = os.path.join(dest_folder, os.path.relpath(src_path, src_folder))
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(src_path, dest_path)

'''
Copy a single file
'''
def copy_file(src_file, dest_folder):
    return shutil.copy(src_file, dest_folder)

'''
Replace the link in text
'''
def replace_links(markdown_content, old_prefix, new_prefix):
    link_pattern = re.compile(r'(\[.*?\]\()(' + re.escape(old_prefix) + r')(.*?\))')
    updated_content = re.sub(link_pattern, r'\1' + new_prefix + r'\3', markdown_content)
    return updated_content

'''
Replace the link within the file
'''
def replace_links_in_file(file_path, old_prefix, new_prefix):
    with open(file_path, 'r', encoding='utf-8') as file:
        file_content = file.read()

    link_pattern = re.compile(r'(\[.*?\]\()(' + re.escape(old_prefix) + r')(.*?\))')
    updated_content = re.sub(link_pattern, r'\1' + new_prefix + r'\3', file_content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

'''
Read the front matter from a markdown file
'''
def _read_front_matter(file_path):
    
    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()

    front_matter_match = re.match(r'^\s*---\n(.*?\n)---\n', markdown_content, re.DOTALL)
    
    if front_matter_match:
        front_matter_content = front_matter_match.group(1)
        return yaml.safe_load(front_matter_content)
    else:
        return None

'''
Write the front matter to a markdown file
'''
def _write_front_matter(file_path, front_matter):
    
    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()
    
    updated_front_matter = yaml.dump(front_matter, default_flow_style=False)
    updated_content = re.sub(r'^\s*---\n.*?\n---\n', '---\n' + updated_front_matter + '---\n', markdown_content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)


'''
Removes the aliases section from the markdown file's front matter
'''
def remove_prop_from_file(file_path, prop):
    
    front_matter = _read_front_matter(file_path)
    if front_matter:
        if "aliases" in front_matter:
            del front_matter[prop]
        _write_front_matter(file_path, front_matter)

'''
Adds categories meta data to the markdown file
'''
def add_categories(file_path, ctg_name, ctgs_arr):
    front_matter = _read_front_matter(file_path)
    if front_matter:
        front_matter[ctg_name] = ctgs_arr
        _write_front_matter(file_path, front_matter)


def _get_short_code_patterns(tag):
    return [r'{{<\s*' + re.escape(tag) + r'\s*[^>]*\s*/\s*>}}', r'{{<\s*' + re.escape(tag) + r'\s*[^>]*\s*>}}']


'''
Removes a short code entirely from Markdown
'''
def remove_short_code(file_path, tag):
    
    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()
    
    updated_content = markdown_content
    for p in _get_short_code_patterns(tag):
        updated_content = re.sub(p, '', updated_content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

'''
Prepends a prefix to the rel refs
'''
def prepend_to_rel_ref_short_code(file_path, new_prefix):

    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()

    starts_with_slash = r'{{<\s*relref\s+"(/[^"]*)"\s*>}}'
    starts_with_char = r'{{<\s*relref\s+"([a-z][^"]*)"\s*>}}'
    starts_with_dot =  r'{{<\s*relref\s+"(\.[^"]*)"\s*>}}'


    updated_content = re.sub(starts_with_slash, r'{{< relref "' +  re.escape('/' + new_prefix ) +  r'\1' +  r'" >}}', markdown_content)
    updated_content = re.sub(starts_with_char, r'{{< relref "' +  re.escape('/' + new_prefix + '/') +  r'\1' +  r'" >}}', updated_content)
    updated_content = re.sub(starts_with_dot, r'{{< relref "' +  r'\1' +  r'" >}}', updated_content)
    

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)


'''
Does a simple find and replace
'''
def find_and_replace(file_path, old, new):
    with open(file_path, 'r', encoding='utf-8') as file:
        markdown_content = file.read()

    updated_content = markdown_content.replace(old, new)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

'''
Clone a repo
'''
def clone_repo(url):
    #tmpdir = tempfile.mkdtemp()
    tmpdir = slash(TMP, 'redislabs-docs')
    Repo.clone_from(url, tmpdir)
    return tmpdir

'''
Find all markdown files
'''
def find_markdown_files(directory):
    markdown_files = []
    for root, dirs, files in os.walk(directory):
        for file in fnmatch.filter(files, '*.md'):
            markdown_files.append(os.path.join(root, file))
    return markdown_files

'''
Read a markdown file
'''
def read_markdown_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()



'''
Fetch the documentation from the several sources that make redis.io
'''
def fetch_io():
    comp_args = {
        'stack': str(slash(DATA_ROOT, 'components/index_migrate.json')),
        'skip-clone': False,
        'loglevel': 'INFO',
        'tempdir': f'{tempfile.gettempdir()}',
        'module' : '*'
    }

    ALL = All(comp_args.get('stack'), None, comp_args)
    logging.basicConfig(level=comp_args.get('loglevel'), format=f'{sys.argv[0]}: %(levelname)s %(asctime)s %(message)s')
    ALL.apply()

'''
Copy the command reference docs
'''
def migrate_commands():
    copy_files(DOCS_SRC_CMD, DOCS_CMD)
    markdown_files = find_markdown_files(DOCS_CMD)
    for f in markdown_files:
        add_categories(f, 'categories', ['docs', 'develop', 'stack', 'oss', 'rs', 'rc', 'oss', 'kubernetes', 'clients'])


'''
Migrate the developer documentation
'''
def migrate_developer_docs():
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
    
    markdown_files = find_markdown_files(DOCS_DEV)
    
    for f in markdown_files:
        print("Replacing links in {}".format(f))
        replace_links_in_file(f, '/docs', '/develop')
        remove_prop_from_file(f, "aliases")
        add_categories(f, 'categories', ['docs', 'develop', 'stack', 'oss', 'rs', 'rc', 'oss', 'kubernetes', 'clients'])

'''
Migrate the operational documentation from redis.io
'''
def migrate_oss_ops_docs():
    DOCS_OPS_OSS_STACK = slash(DOCS_OPS, 'oss_and_stack')
    mkdir(DOCS_OPS_OSS_STACK)
    mkdir(slash(DOCS_OPS_OSS_STACK, 'reference'))
    create_index_file(DOCS_OPS_OSS_STACK, 'Redis OSS and Stack', 'Operate Redis OSS and Redis Stack')
    create_index_file(slash(DOCS_OPS_OSS_STACK, 'reference'), 'Reference', 'Redis OSS and Redis Stack reference documentation')

    ops_content = ['install', 'management', 'reference/internals', 'reference/signals.md', 'reference/cluster-spec.md', 'reference/arm.md']

    for topic in ops_content:
        source = slash(DOCS_SRC_DOCS, topic)
        
        if str(topic).endswith('.md'):
            target = slash(DOCS_OPS_OSS_STACK, topic.split('/')[0])
            copy_file(source, target)
        else:
            target = slash(DOCS_OPS_OSS_STACK, topic)
            copy_files(source, target)

    markdown_files = find_markdown_files(DOCS_OPS_OSS_STACK)
    
    for f in markdown_files:
        print("Replacing links in {}".format(f))
        replace_links_in_file(f, '/docs', '/operate/oss_and_stack')
        remove_prop_from_file(f, 'aliases')
        add_categories(f, 'categories', ['docs', 'operate', 'stack', 'oss'])

'''
Fetch all the docs of docs.redis.com
'''
def fetch_docs_redis_com():
    repo = clone_repo("https://github.com/RedisLabs/redislabs-docs")
    return repo

'''
Migrate the docs from docs.redis.com
'''
def migrate_enterprise_ops_docs(repo):
    repo_content = slash(repo, 'content/') 
    content = ['rs', 'rc', 'kubernetes', 'stack']    

    for topic in content:
        source = slash(repo_content, topic)

        if topic == 'stack':
            target = slash(DOCS_OPS, 'oss_and_stack/stack-with-enterprise')
        else:
            target = slash(DOCS_OPS, topic)

        copy_files(source, target)
        
        markdown_files = find_markdown_files(target)
        for f in markdown_files:
            try:
                remove_prop_from_file(f, 'aliases')
                remove_prop_from_file(f, 'categories')
                add_categories(f, 'categories', ['docs', 'operate', topic])
                remove_short_code(f, 'allchildren')
                remove_short_code(f, 'table-children')
                prepend_to_rel_ref_short_code(f,'operate')
                find_and_replace(f, '/operate/glossary', '/glossary')
                find_and_replace(f, '/operate/stack', '/operate/oss_and_stack/stack-with-enterprise')
            except Exception as e:
                print("Error processing file {} with error {}".format(f, e))


'''
Migrate the glossary from docs.redis.com
'''
def migrate_gloassary(repo):
    repo_content = slash(repo, 'content/') 
    source = slash(repo_content, 'glossary')
    target = slash(DOCS_ROOT, 'glossary')
    copy_files(source, target)

    markdown_files = find_markdown_files(target)
    for f in markdown_files:
        find_and_replace(f, '/rs/', '/operate/rs/')
        find_and_replace(f, '/rc/', '/operate/rc/')
        find_and_replace(f, '/kubernetes/', '/operate/kubernetes/')

'''
Migrate static files over
'''
def migrate_static_files(repo):
    static = slash(repo, 'static/')
    content = ['code', 'images', 'pkgs', 'tables' ]

    for folder in content:
        source = slash(static, folder)
        target = slash(STATIC_ROOT, folder)
        copy_files(source, target)


'''
Migration script
'''
if __name__ == "__main__":
    # The working directory is the parent folder of the directory of this script
    print("## Setting the migration environment ...")
    print(set_env())

    #print("## Fetching temporary development documentation content ...")
    #fetch_io()

    #print("## Migrating commands to {}".format(DOCS_CMD))
    #migrate_commands()
    

    #print("## Migrating developer documentation to {} ...".format(DOCS_DEV))
    #migrate_developer_docs()

    #print("## Migrating operator documentation to {} ...".format(DOCS_OPS))
    #migrate_oss_ops_docs()

    print("## Fetching temporary Enterprise documentation content ...")
    repo = fetch_docs_redis_com()
    #migrate_enterprise_ops_docs(repo)
    #migrate_gloassary(repo)
    migrate_static_files(repo)
    delete_folder(repo)



    # TODO: Serve the site and check for still broken links


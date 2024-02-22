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
import csv


'''
Set the migration environment
'''
def set_env():
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
    globals()['DOCS_INT'] = slash(DOCS_ROOT, 'integrate/')
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
TODO: Delete a single file
'''
def delete_file(file_path):
    os.remove(file_path)


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

def _load_csv_file(file_path):
    
    result = {}
    
    script_path = os.getcwd() + '/' + __file__
    csv_file = slash(os.path.dirname(script_path), file_path)

    with open(csv_file) as cf:
        reader = csv.DictReader(cf, delimiter=';')
        for row in reader:
            key = row['broken_ref']
            value = row['fixed_ref']
            result[key] = value
    
    return result


'''
The replace link function that is passed over to re.sub
'''
def _replace_link(match, new_prefix):
    # Relrefs don't like dots in the link
    if '.' in match.group(3):
        result =  match.group(1) + '{{< baseurl >}}' + new_prefix + match.group(3) + match.group(4)

        # Some command pages have a . in them which causes issues
        if new_prefix == "/commands":
            result =  match.group(1) + '{{< baseurl >}}' + new_prefix + match.group(3) + "/" + match.group(4)
    else:
        result =  match.group(1) + '{{< relref "' + new_prefix + match.group(3) + '" >}}' + match.group(4)

    return result

'''
Helps to substitute the prefix https://redis.io with e.g. / within a link
'''
def fq_link_to_page_link_in_file(file_path, old_prefix, new_prefix):
    with open(file_path, 'r', encoding='utf-8') as file:
        file_content = file.read()
    link_pattern = re.compile(r'(\[.*?\]\()(' + re.escape(old_prefix) + r')(.*?)' + r'(\))')
    updated_content = re.sub(link_pattern, r'\1' + new_prefix + r'\3' + r'\4', file_content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)


'''
Returns the content of a file as string
'''
def _read_file(file_path):
    file = open(file_path, 'r', encoding='utf-8')
    file_content = file.read()
    file.close()
    return file_content


'''
Writes a string to the file
'''
def _write_file(file_path, updated_content):
    file = open(file_path, 'w', encoding='utf-8')
    file.write(updated_content)
    file.close()


'''
The documentation currently uses the shortcode in a way like:

{{<image filename="images/rc/account-settings-cloud-account-tab.png" alt="Use the Cloud Account tab of the Account Settings screen to define cloud accounts for your Redis Cloud subscription." width="75%">}}Test regexp{{< /image >}}

However, none of the files uses the text below the image because it's strictly seen really just plain text. Instead the alt property is used for the file caption. So we are rewriting the {{< image >}}{{< /image >}} to just {{< image >}}
'''
def replace_img_short_code(file_path):
    print("Replacing file " + file_path)
    file_content = _read_file(file_path)
    img_pattern = re.compile(r'({{<.*image.*>}})' + r'(.*{{<.*/image.*>}})')
    updated_content = re.sub(img_pattern, r'\1', file_content)
    updated_content = updated_content.replace('{{< /image >}}', '')
    _write_file(file_path, updated_content)



'''
Assumes that there is an image tag with an absolute path to the image


<img src="/docs/interact/programmability/triggers-and-functions/images/tf-rdi-1.png">
'''
def replace_img_tag_in_file(file_path, old_prefix, new_prefix):
    
    file_content = _read_file(file_path)
    img_pattern = re.compile(r'(<img src=")(' + re.escape(old_prefix) + r')(.*?)' + r'(">|"/>)')
    updated_content = re.sub(img_pattern, '{{< image filename="' +  new_prefix + r'\3' + '" >}}', file_content)
    _write_file(file_path, updated_content)


'''
Assumes that there is image markdown syntax. Here an example.

![Pending status icon](/images/rc/icon-database-update-status-pending.png#no-click "Pending database status")
'''
def replace_img_md_in_file(file_path, old_prefix, new_prefix):
    file_content = _read_file(file_path)

    # TODO: Some markdown uses a space in between the round brackets
    img_pattern = re.compile(r'\!\[(.*?)\]\((' + re.escape(old_prefix) + r')(.*?)\s*(?:"(.*?)")?\)')
    updated_content = re.sub(img_pattern, '{{< image filename="' +  new_prefix + r'\3' + '" alt="' + r'\4' + '" >}}', file_content)
    updated_content = updated_content.replace(' alt=""', '')
    _write_file(file_path, updated_content)

'''
Replace the link within the file
'''
def replace_links_in_file(file_path, old_prefix, new_prefix):
    
    file_content = _read_file(file_path)

    link_pattern = re.compile(r'(\[.*?\]\()(' + re.escape(old_prefix) + r')(.*?)' + r'(\))')
    updated_content = re.sub(link_pattern, lambda match: _replace_link(match, new_prefix), file_content)

    # Correct links based on a list
    corrected_links = _load_csv_file('./migrate/corrected_refs.csv')

    for k in corrected_links:
        # Relrefs don't like dots and hashtags in the link
        if '.' in corrected_links[k]:
            updated_content = updated_content.replace('{{< relref "' + k + '" >}}', '{{< baseurl >}}' + corrected_links[k])
        elif '#' in k:
            updated_content = updated_content.replace('{{< relref "' + k + '" >}}', '{{< baseurl >}}' + corrected_links[k] + '#' + k.split('#')[1])
        else:
            updated_content = updated_content.replace('{{< relref "' + k + '" >}}', '{{< relref "' + corrected_links[k] + '" >}}')    

    _write_file(file_path, updated_content)

'''
Read the front matter from a markdown file
'''
def _read_front_matter(file_path):
    
    markdown_content = _read_file(file_path)

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
    
    markdown_content = _read_file(file_path)

    try:    
        updated_front_matter = yaml.dump(front_matter, default_flow_style=False)
        updated_content = re.sub(r'^\s*---\n.*?\n---\n', '---\n' + updated_front_matter + '---\n', markdown_content, flags=re.DOTALL)
        _write_file(file_path, updated_content)
    except Exception as e:
        print("ERR: Could not write front matter to file {}".format(file_path))



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


'''
Adds type meta data to the markdown file
'''
def add_properties(file_path, prop_dict):
    front_matter = _read_front_matter(file_path)
    if front_matter:
        for k  in prop_dict:
            front_matter[k] = prop_dict[k]
        _write_front_matter(file_path, front_matter)

# TODO: Why did I use two patterns here?
#def _get_short_code_patterns(tag):
#    return [r'{{<\s*' + re.escape(tag) + r'\s*[^>]*\s*/\s*>}}', r'{{<\s*' + re.escape(tag) + r'\s*[^>]*\s*>}}']


'''
Removes a short code entirely from Markdown
'''
def remove_short_code(file_path, tag):
    markdown_content = _read_file(file_path)
    pattern = r'{{<\s*' + re.escape(tag) + r'.*' + r'\s*>}}'
    updated_content = re.sub(pattern, '', markdown_content)
    _write_file(file_path, updated_content)

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
Find all files that match a specific name pattern
'''
def find_files(directory, filter):
    resulting_files = []
    for root, dirs, files in os.walk(directory):
        for file in fnmatch.filter(files, filter):
            resulting_files.append(os.path.join(root, file))
    return resulting_files

'''
Find all markdown files
'''
def find_markdown_files(directory):
    return find_files(directory, '*.md')



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
        remove_prop_from_file(f, "aliases")

        replace_links_in_file(f, '/docs', '/develop')
        replace_links_in_file(f, '/commands', '/commands')
        replace_links_in_file(f, 'https://redis.io/', '/')
'''
Migrate the developer documentation
'''
def migrate_developer_docs():

    create_index_file(DOCS_DEV, 'Develop', 'Learn how to develop with Redis')

    dev_content = ['get-started', 'connect', 'data-types', 'interact', 'manual', 'reference']

    for topic in dev_content:
        source = slash(DOCS_SRC_DOCS, topic)
        target = slash(DOCS_DEV, topic)

        # Rename manual to use
        if (topic == 'manual'):
            target = slash(DOCS_DEV, 'use')

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
        
        # Links
        fq_link_to_page_link_in_file(f, 'https://redis.io/', '/')
        replace_links_in_file(f, '/docs', '/develop')       
        replace_links_in_file(f, '/commands', '/commands')

        # Images
        replace_img_tag_in_file(f, '/docs', '/develop')
        replace_img_md_in_file(f, '/docs', '/develop')

        # Front matter
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

        # Links
        replace_links_in_file(f, '/docs', '/operate/oss_and_stack')
        remove_prop_from_file(f, 'aliases')

        # Images
        replace_img_tag_in_file(f, '/docs', '/operate/oss_and_stack')
        replace_img_md_in_file(f, '/docs', '/operate/oss_and_stack')

        # Front matter
        remove_prop_from_file(f, "aliases")
        add_categories(f, 'categories', ['docs', 'operate', 'stack', 'oss'])

'''
Fetch all the docs of docs.redis.com
'''
def fetch_docs_redis_com():
    repo = clone_repo("https://github.com/RedisLabs/redislabs-docs")
    return repo


def _test_img_short_code_rewrite():

    for t in ['rc', 'rs', 'kubernetes', 'oss_and_stack']:
        target = slash(DOCS_OPS, t)
        markdown_files = find_markdown_files(target)
        for f in markdown_files:
            replace_img_short_code(f)

            # Most images in the Enterprise docs are taken from the static images folder
            replace_img_md_in_file(f,'/images', '/images') 

'''
Migrate the docs from docs.redis.com
'''
def migrate_enterprise_ops_docs(repo):
    repo_content = slash(repo, 'content/') 
    content = ['rs', 'rc', 'kubernetes', 'stack', 'embeds']    

    for topic in content:
        source = slash(repo_content, topic)

        if topic == 'stack':
            target = slash(DOCS_OPS, 'oss_and_stack/stack-with-enterprise')
        elif topic == 'embeds':
            target = slash(DOCS_ROOT, 'embeds')
        else:
            target = slash(DOCS_OPS, topic)

        copy_files(source, target)
        
        markdown_files = find_markdown_files(target)
        for f in markdown_files:
            try:
                # Front matter
                remove_prop_from_file(f, 'aliases')
                remove_prop_from_file(f, 'categories')
                add_categories(f, 'categories', ['docs', 'operate', topic])
                
                # Short codes
                remove_short_code(f, 'allchildren')
                remove_short_code(f, 'embed-html')
                
                # Links
                # TODO: See if we can use the replace_links_in_file function for all of that
                prepend_to_rel_ref_short_code(f,'operate')
                find_and_replace(f, '/operate/glossary', '/glossary')
                find_and_replace(f, '/operate/stack', '/operate/oss_and_stack/stack-with-enterprise')

                # Causes to fix links with that prefix from the CSV file
                replace_links_in_file(f, '/glossary', '/glossary')
                replace_links_in_file(f, '/operate', '/operate')
                replace_links_in_file(f, '/develop', '/develop')
                
                # Images
                replace_img_short_code(f)
                replace_img_tag_in_file(f, '/images', '/images')
                replace_img_md_in_file(f, '/images', '/images')


            except Exception as e:
                print("ERR: Error processing file {} with error {}".format(f, e))


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
Creates a slug name from a file name
'''
def _slug(name):
    return name.replace(".", " ").replace(" ", "-").replace('--', '-').lower()


'''
Move some integrations documentation from the operational docs to the integrations section
'''
def migrate_integration_docs(repo):
    
    integrations = {
        "Amazon Bedrock" : {"weight" : 3, "source" : "operate/rc/cloud-integrations/aws-marketplace/aws-bedrock/", "type": "cloud-service", "desc": "With Amazon Bedrock, users can access foundational AI models from a variety of vendors through a single API, streamlining the process of leveraging generative artificial intelligence."},
        "Confluent with Redis Cloud" : {"weight" : 8, "source" : "operate/rc/cloud-integrations/confluent-cloud.md", "type": "di", "desc" : "The Redis Sink connector for Confluent Cloud allows you to send data from Confluent Cloud to your Redis Cloud database." },
        "Prometheus with Redis Cloud" : { "weight" : 6, "source" : "operate/rc/cloud-integrations/prometheus-integration.md", "type": "observability", "desc" : "You can use Prometheus and Grafana to collect and visualize your Redis Cloud metrics."},
        "Prometheus with Redis Enterprise" : {"weight" : 5, "source" : "operate/rs/clusters/monitoring/prometheus-integration.md", "type": "observability", "desc" : "You can use Prometheus and Grafana to collect and visualize your Redis Enterprise Software metrics."},
        "Prometheus metrics" : { "weight" : 5, "source" : "operate/rs/clusters/monitoring/prometheus-metrics-definitions.md", "type": "subpage", "target" : "Prometheus with Redis Enterprise", "desc" : "You can use Prometheus and Grafana to collect and visualize your Redis Enterprise Software metrics."},
        "Uptrace with Redis Enterprise" : { "weight" : 7, "source" : "operate/rs/clusters/monitoring/uptrace-integration.md", "type": "observability", "desc" : "To collect, view, and monitor metrics data from your databases and other cluster components, you can connect Uptrace to your Redis Enterprise cluster using OpenTelemetry Collector."},
        "Nagios with Redis Enterprise" : { "weight" : 7, "source" : "operate/rs/clusters/monitoring/nagios-plugin.md", "type": "observability", "desc" : "This Nagios plugin enables you to monitor the status of Redis Enterprise related components and alerts."},
        "Pulumi provider for Redis Cloud" : { "weight" : 4, "source" : "operate/rc/cloud-integrations/pulumi/", "type": "provisioning", "desc" : "With the Redis Cloud Resource Provider you can provision Redis Cloud resources by using the programming language of your choice."},
        "Terraform provider for Redis Cloud" : { "weight" : 4, "source" : "operate/rc/cloud-integrations/terraform/", "type": "provisioning", "desc" : "The Redis Cloud Terraform provider allows you to provision and manage Redis Cloud resources." },
        "Redis Data Integration" : { "weight" : 1, "source" : "repo/content/rdi", "type" : "di", "desc" : "Redis Data Integration keeps Redis in sync with the primary database in near real time."},
        "RedisOM for Java" : { "weight" : 9, "source" : "develop/connect/clients/om-clients/stack-spring.md", "type" : "library", "desc" : "The Redis OM for Java library is based on the Spring framework and provides object-mapping abstractions.", "images" : "images/*_spring.png", "parent_page" : "_index.md" },
        "RedisOM for .NET" : { "weight" : 9, "source" : "develop/connect/clients/om-clients/stack-dotnet.md", "type" : "library", "desc" : "Redis OM for .NET is an object-mapping library for Redis.", "parent_page" : "_index.md"},
        "RedisOM for Python" : { "weight" : 9, "source" : "develop/connect/clients/om-clients/stack-python.md", "type" : "library", "desc" : "Redis OM for Python is an object-mapping library for Redis.", "images" : "images/python_*.png", "parent_page" : "_index.md"},
        "RedisOM for Node.js" : { "weight" : 9, "source" : "develop/connect/clients/om-clients/stack-node.md", "type" : "library", "desc" : "Redis OM for Node.js is an object-mapping library for Redis.", "images" : "images/* | grep -e '^[A-Z]'", "parent_page" : "_index.md"}
    }

    for k in integrations:
        data = integrations[k]
        source = data['source']
        ctype = data['type']
        desc = data['desc']
        weight = data.get('weight')

        ## Move files from operate to integrate
        if source.startswith('operate'):

            source = slash(DOCS_ROOT, source)

            if ctype != "subpage":

                slug = _slug(k)
                target = slash(DOCS_INT, slug)
                print("Copying from {} to {} ...".format(source, target))

                try:
                    if source.endswith('/'):
                        copy_files(source, target)
                    elif source.endswith('.md'):
                        copy_file(source, slash(target, '_index.md'))
                except FileNotFoundError as e:
                    print("Skipping {}".format(source))

            
            else:
                sptarget = data['target']
                slug = _slug(sptarget)
                target = slash(DOCS_INT, slug)
                print("Copying from {} to {} ...".format(source, target))
                
                try:
                    copy_file(source, target)
                except FileNotFoundError as e:
                    print("Skipping {}".format(source))

            # Delete the old folder under /operate
            try:
                if source.endswith('.md'):
                    delete_file(source)
                else:
                    delete_folder(source)
            except FileNotFoundError as e:
                print("Skipping deletion of {}".format(source))


        elif source.startswith('develop'):

            source = slash(DOCS_ROOT, source)
            img_src_folder=slash(os.path.dirname(source), 'images')
            slug = _slug(k)
            target = slash(DOCS_INT, slug)
            mkdir(slash(target, 'images'))

            try:
                print("Copying from {} to {}".format(source, target))
                # Copy files
                copy_file(source, slash(target, '_index.md'))

                if slug.endswith('java'):
                    images = find_files(img_src_folder, '*_spring.png')
                elif slug.endswith('python'):
                    images  = find_files(img_src_folder, 'python_*.png')
                elif slug.endswith('net'):
                    images = [slash(img_src_folder, 'Add_Redis_Database_button.png'), 
                          slash(img_src_folder, 'Configure_Redis_Insight_Database.png'),
                          slash(img_src_folder, 'Accept_EULA.png')
                    ]
                else:
                    images = []
            
                for img in images:
                    copy_file(img, slash(target, 'images'))
            except FileNotFoundError as e:
                print("Skipping ...")

            # Delete files
            try:
                delete_file(source)
                for img in images:
                    delete_file(img)
            except FileNotFoundError as e:
                print("Skipping deletion of {}".format(source))
        elif source.startswith('repo'):
            source = source.replace('repo', repo)
            slug = _slug(k)
            target = slash(DOCS_INT, slug)
            print("Copying from {} to {} ...".format(source, target))
            copy_files(source, target)

        # Post-process files within the target
        markdown_files = find_markdown_files(target)

        for f in markdown_files:
            print("Postprocessing {}".format(f))

            ## Add front matter
            categories = [ "docs", "integrate" ]
                
            if "cloud" in slug:
                categories.append("rc")
            elif "aws" in slug:
                categories.append("rc")
            elif "enterprise" in slug:
                categories.append("rs")
            elif "integration" in slug:
                categories.append("rs")
                categories.append("rdi")
            else:
                categories.append("oss")
                categories.append("rs")
                categories.append("rc")

            meta = {}
            if f.endswith(slash(DOCS_INT, _slug(k) + "/_index.md")) and ctype != "subpage":
                meta = {"weight" : int(weight)}
                meta['Title'] = k
                meta['LinkTitle'] = k
                meta['linkTitle'] = k    
        
            meta.update({ "type": "integration", "group" : ctype, "summary" : desc,  "categories": categories})
            add_properties(f, meta)
            
            # Some files use linkTitle, and some other LinkTitle. Let's remove the redundant link title.
            if f.endswith(slash(DOCS_INT, _slug(k) + "/_index.md")):
                try:
                    remove_prop_from_file(f, 'linkTitle')
                except KeyError as e:
                    print("The file {} doesn't have a property linkTitle".format(f))
                
            ## Redmove short codes
            remove_short_code(f, 'allchildren')

            ## Fix internal links for the rdi docs
            if _slug(k) == 'redis-data-integration':
                find_and_replace(f, '"/rdi', '"/integrate/{}'.format(_slug(k)))
                find_and_replace(f, '"rdi/', '"/integrate/{}/'.format(_slug(k)))
                find_and_replace(f, '"/stack', '"/operate/oss_and_stack/stack-with-enterprise')
                find_and_replace(f, '"/rs', '"/operate/rs')

            ## Fix internal links for the stuff that was moved from /operate and /develop
            if data['source'].startswith('operate') or data['source'].startswith('develop'):
                old_prefix = data['source']

                if old_prefix.endswith('.md'):
                    old_prefix = old_prefix.replace('.md', '')
                
                new_prefix = "integrate" + "/" + _slug(k) + "/"

                print("Fixing links from {} to {}".format(old_prefix, new_prefix))
                find_and_replace(f,  old_prefix, new_prefix)

            # Replace the image markdown with the shortcode
            replace_img_md_in_file(f, '/images', '/images')

            # Fix broken dev images
            find_and_replace(f, '../images/', './images/')    

            # Ensure that the right image short code is used
            replace_img_short_code(f)     

    
    # Fix remaining links
    target_folders = [DOCS_INT, DOCS_OPS, DOCS_DEV]

    for tf in target_folders:
        markdown_files = find_markdown_files(tf)
        corrected_links = _load_csv_file('./migrate/corrected_int_refs.csv')
    
        for f in markdown_files:
            for k in corrected_links:
                find_and_replace(f, k, corrected_links[k])



'''
Migration script
'''
if __name__ == "__main__":
    # The working directory is the parent folder of the directory of this script
    print("## Setting the migration environment ...")
    print(set_env())

    '''
    print("## Fetching temporary development documentation content ...")
    fetch_io()

    print("## Migrating commands to {}".format(DOCS_CMD))
    migrate_commands()
    

    print("## Migrating developer documentation to {} ...".format(DOCS_DEV))
    migrate_developer_docs()

    print("## Migrating operator documentation to {} ...".format(DOCS_OPS))
    migrate_oss_ops_docs()

    print("## Fetching temporary Enterprise documentation content ...")
    repo = fetch_docs_redis_com()
    migrate_enterprise_ops_docs(repo)
    migrate_gloassary(repo)
    migrate_static_files(repo)
    delete_folder(repo)
    '''

    print("## Fetching temporary Enterprise documentation content ...")
    #repo = fetch_docs_redis_com()
    repo = "/tmp/redislabs-docs"

    print("## Migrating the integrations docs ...")
    migrate_integration_docs(repo)
    #delete_folder(repo)

    
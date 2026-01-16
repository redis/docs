#!/usr/bin/env python3
"""
Configuration management for jupyterize.

Handles loading language-specific configuration and managing Jupyter kernel
specifications.
"""

import json
import logging
import os


# Jupyter kernel specifications for different languages
KERNEL_SPECS = {
    'python': {
        'name': 'python3',
        'display_name': 'Python 3',
        'language': 'python',
        'language_info': {
            'name': 'python',
            'version': '3.x.x',
            'mimetype': 'text/x-python',
            'file_extension': '.py'
        }
    },
    'node.js': {
        'name': 'javascript',
        'display_name': 'JavaScript (Node.js)',
        'language': 'javascript',
        'language_info': {
            'name': 'javascript',
            'version': '20.0.0',
            'mimetype': 'application/javascript',
            'file_extension': '.js'
        }
    },
    'go': {
        'name': 'gophernotes',
        'display_name': 'Go',
        'language': 'go',
        'language_info': {
            'name': 'go',
            'version': '1.x.x',
            'mimetype': 'text/x-go',
            'file_extension': '.go'
        }
    },
    'c#': {
        'name': '.net-csharp',
        'display_name': '.NET (C#)',
        'language': 'C#',
        'language_info': {
            'name': 'C#',
            'version': '12.0',
            'mimetype': 'text/x-csharp',
            'file_extension': '.cs',
            'pygments_lexer': 'csharp'
        }
    },
    'java': {
        'name': 'java',
        'display_name': 'Java',
        'language': 'java',
        'language_info': {
            'name': 'java',
            'version': '11.0.0',
            'mimetype': 'text/x-java-source',
            'file_extension': '.java'
        }
    },
    'php': {
        'name': 'php',
        'display_name': 'PHP',
        'language': 'php',
        'language_info': {
            'name': 'php',
            'version': '8.0.0',
            'mimetype': 'application/x-php',
            'file_extension': '.php'
        }
    },
    'rust': {
        'name': 'rust',
        'display_name': 'Rust',
        'language': 'rust',
        'language_info': {
            'name': 'rust',
            'version': '1.x.x',
            'mimetype': 'text/x-rust',
            'file_extension': '.rs'
        }
    }
}


def load_language_config(language):
    """
    Load language-specific configuration from jupyterize_config.json.

    Args:
        language: Language name (e.g., 'python', 'c#')

    Returns:
        dict: Configuration for the language, or empty dict if not found
    """
    config_file = os.path.join(os.path.dirname(__file__), 'jupyterize_config.json')
    if not os.path.exists(config_file):
        logging.debug(f"Configuration file not found: {config_file}")
        return {}

    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config.get(language.lower(), {})
    except json.JSONDecodeError as e:
        logging.warning(f"Failed to parse configuration file: {e}")
        return {}
    except Exception as e:
        logging.warning(f"Error loading configuration: {e}")
        return {}


def get_kernel_spec(language):
    """
    Get kernel specification for a language.

    Args:
        language: Language name (e.g., 'python', 'c#')

    Returns:
        dict: Kernel specification, or None if not found

    Raises:
        ValueError: If language is not supported
    """
    kernel_spec = KERNEL_SPECS.get(language.lower())
    if not kernel_spec:
        raise ValueError(f"No kernel specification for language: {language}")
    return kernel_spec


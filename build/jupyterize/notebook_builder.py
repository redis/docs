#!/usr/bin/env python3
"""
Notebook building for jupyterize.

Creates Jupyter notebook cells and assembles complete notebooks.
"""

import logging
import os
import re
import textwrap

import nbformat
from nbformat.v4 import new_notebook, new_code_cell

from config import load_language_config, get_kernel_spec
from unwrapper import CodeUnwrapper


class NotebookBuilder:
    """Builds Jupyter notebooks from parsed code blocks."""

    def __init__(self, language):
        """
        Initialize builder for a specific language.

        Args:
            language: Programming language (e.g., 'python', 'c#')
        """
        self.language = language
        self.config = load_language_config(language)

    def build(self, parsed_blocks):
        """
        Build notebook from parsed blocks.

        Args:
            parsed_blocks: List of dicts with 'code' and 'step_name'

        Returns:
            nbformat.NotebookNode: Complete notebook
        """
        cells = self._create_cells(parsed_blocks)
        notebook = self._create_notebook(cells)
        return notebook

    def _create_cells(self, parsed_blocks):
        """
        Convert parsed blocks to notebook cells.

        Args:
            parsed_blocks: List of dicts with 'code' and 'step_name'

        Returns:
            list: List of nbformat cell objects
        """
        cells = []

        # Get boilerplate if defined
        boilerplate = self.config.get('boilerplate', [])
        boilerplate_code = '\n'.join(boilerplate) if boilerplate else None

        # For Go, append boilerplate to first cell instead of creating separate cell
        append_boilerplate_to_first_cell = self.language.lower() == 'go'

        # Add boilerplate cell if defined (except for Go, which appends to first cell)
        if boilerplate and not append_boilerplate_to_first_cell:
            boilerplate_cell = new_code_cell(source=boilerplate_code)
            boilerplate_cell.metadata['cell_type'] = 'boilerplate'
            boilerplate_cell.metadata['language'] = self.language
            cells.append(boilerplate_cell)
            logging.info(f"Added boilerplate cell for {self.language} ({len(boilerplate)} lines)")

        # Process regular cells
        first_cell_processed = False
        for i, block in enumerate(parsed_blocks):
            code = block['code']

            # Apply unwrapping if configured
            if self.config.get('unwrap_patterns'):
                unwrapper = CodeUnwrapper(self.language)
                original_code = code
                code = unwrapper.unwrap(code)
                if code != original_code:
                    logging.debug(f"Applied unwrapping to cell {i}")

            # Dedent code if unwrap patterns are configured
            if self.config.get('unwrap_patterns'):
                code = textwrap.dedent(code)

            # Strip trailing whitespace
            code = code.rstrip()

            # Skip empty cells
            if not code.strip():
                logging.debug(f"Skipping empty cell {i}")
                continue

            # Skip cells that contain only closing braces and whitespace
            if self.config.get('unwrap_patterns'):
                code_no_whitespace = re.sub(r'\s', '', code)
                if code_no_whitespace and re.match(r'^}+$', code_no_whitespace):
                    logging.debug(f"Skipping cell {i} (contains only closing braces)")
                    continue

            # For Go: append boilerplate to first cell (imports)
            if append_boilerplate_to_first_cell and not first_cell_processed:
                if boilerplate_code:
                    code = code + '\n\n' + boilerplate_code
                    logging.info(f"Appended boilerplate to first cell for {self.language}")
                first_cell_processed = True

            # Create code cell
            cell = new_code_cell(source=code)

            # Add step metadata if present and enabled for this language
            add_step_metadata = self.config.get('add_step_metadata', True)
            if block['step_name'] and add_step_metadata:
                cell.metadata['step'] = block['step_name']
                logging.debug(f"Created cell {i} with step '{block['step_name']}'")
            else:
                logging.debug(f"Created cell {i} (preamble)")

            cells.append(cell)

        logging.info(f"Created {len(cells)} notebook cells")
        return cells

    def _create_notebook(self, cells):
        """
        Create complete Jupyter notebook.

        Args:
            cells: List of nbformat cell objects

        Returns:
            nbformat.NotebookNode: Complete notebook
        """
        nb = new_notebook()
        nb.cells = cells

        # Set kernel metadata
        kernel_spec = get_kernel_spec(self.language)

        nb.metadata.kernelspec = {
            'display_name': kernel_spec['display_name'],
            'language': kernel_spec.get('language', self.language.lower()),
            'name': kernel_spec['name']
        }

        # Use language_info from kernel spec
        nb.metadata.language_info = kernel_spec.get('language_info', {
            'name': self.language.lower()
        })

        logging.info(f"Created notebook with kernel: {kernel_spec['name']}")
        return nb

    def write(self, notebook, output_path):
        """
        Write notebook to file.

        Args:
            notebook: nbformat.NotebookNode object
            output_path: Output file path
        """
        # Create output directory if needed
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            logging.debug(f"Created output directory: {output_dir}")

        # Write notebook
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                nbformat.write(notebook, f)
            logging.info(f"Wrote notebook to: {output_path}")
        except IOError as e:
            raise IOError(f"Failed to write notebook: {e}")


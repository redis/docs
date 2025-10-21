#!/usr/bin/env python3
"""
Basic tests for jupyterize.py

Run with: python test_jupyterize.py
"""

import os
import sys
import tempfile
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from jupyterize import jupyterize, detect_language, validate_input, parse_file


def test_language_detection():
    """Test language detection from file extensions."""
    print("Testing language detection...")
    
    assert detect_language('example.py') == 'python'
    assert detect_language('example.js') == 'node.js'
    assert detect_language('example.go') == 'go'
    assert detect_language('example.cs') == 'c#'
    assert detect_language('example.java') == 'java'
    assert detect_language('example.php') == 'php'
    assert detect_language('example.rs') == 'rust'
    
    # Test unsupported extension
    try:
        detect_language('example.txt')
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unsupported file extension" in str(e)
    
    print("✓ Language detection tests passed")


def test_basic_conversion():
    """Test converting a simple Python file."""
    print("\nTesting basic conversion...")
    
    # Create test file
    test_content = """# EXAMPLE: test
import redis

# STEP_START connect
r = redis.Redis()
# STEP_END

# STEP_START set_get
r.set('foo', 'bar')
r.get('foo')
# STEP_END
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        # Convert
        output_file = test_file.replace('.py', '.ipynb')
        result = jupyterize(test_file, output_file, verbose=False)
        
        # Validate output exists
        assert os.path.exists(output_file), "Output file not created"
        
        # Load and validate notebook
        with open(output_file) as f:
            nb = json.load(f)
        
        # Check structure
        assert 'cells' in nb
        assert 'metadata' in nb
        assert nb['nbformat'] == 4
        
        # Check kernel
        assert nb['metadata']['kernelspec']['name'] == 'python3'
        assert nb['metadata']['kernelspec']['display_name'] == 'Python 3'
        
        # Check cells
        assert len(nb['cells']) == 3  # Preamble + 2 steps
        assert all(cell['cell_type'] == 'code' for cell in nb['cells'])
        
        # Check step metadata
        assert 'step' not in nb['cells'][0]['metadata']  # Preamble has no step
        assert nb['cells'][1]['metadata']['step'] == 'connect'
        assert nb['cells'][2]['metadata']['step'] == 'set_get'
        
        print("✓ Basic conversion test passed")
        
    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_hide_remove_blocks():
    """Test that HIDE blocks are included and REMOVE blocks are excluded."""
    print("\nTesting HIDE and REMOVE blocks...")
    
    test_content = """# EXAMPLE: test_markers
# HIDE_START
import redis
r = redis.Redis()
# HIDE_END

# REMOVE_START
r.flushdb()  # This should be excluded
# REMOVE_END

# STEP_START test
r.set('key', 'value')
# STEP_END
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        output_file = test_file.replace('.py', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)
        
        with open(output_file) as f:
            nb = json.load(f)
        
        # Check that HIDE content is included
        preamble_source = ''.join(nb['cells'][0]['source'])
        assert 'import redis' in preamble_source
        assert 'r = redis.Redis()' in preamble_source
        
        # Check that REMOVE content is excluded
        all_source = ''.join(''.join(cell['source']) for cell in nb['cells'])
        assert 'flushdb' not in all_source
        
        print("✓ HIDE/REMOVE blocks test passed")
        
    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_javascript_file():
    """Test converting a JavaScript file."""
    print("\nTesting JavaScript conversion...")
    
    test_content = """// EXAMPLE: test_js
// STEP_START connect
import { createClient } from 'redis';
const client = createClient();
await client.connect();
// STEP_END

// STEP_START set_get
await client.set('key', 'value');
const value = await client.get('key');
// STEP_END
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        output_file = test_file.replace('.js', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)
        
        with open(output_file) as f:
            nb = json.load(f)
        
        # Check kernel
        assert nb['metadata']['kernelspec']['name'] == 'javascript'
        assert nb['metadata']['kernelspec']['display_name'] == 'JavaScript (Node.js)'
        
        # Check cells
        assert len(nb['cells']) == 2  # 2 steps
        
        print("✓ JavaScript conversion test passed")
        
    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_marker_format_variations():
    """Test that markers work with and without space after comment prefix."""
    print("\nTesting marker format variations...")

    # Test with no space after # (e.g., #EXAMPLE: instead of # EXAMPLE:)
    test_content = """#EXAMPLE: test_no_space
import redis

#STEP_START connect
r = redis.Redis()
#STEP_END
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.py', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Should still parse correctly
        assert len(nb['cells']) == 2  # Preamble + step
        assert nb['cells'][1]['metadata']['step'] == 'connect'

        print("✓ Marker format variations test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_duplicate_step_names():
    """Test warning for duplicate step names."""
    print("\nTesting duplicate step names...")

    test_content = """# EXAMPLE: test_duplicates
# STEP_START connect
r = redis.Redis()
# STEP_END

# STEP_START connect
# This is a duplicate step name
r.ping()
# STEP_END
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.py', '.ipynb')
        # Should complete but log a warning
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Both steps should be created
        assert len(nb['cells']) == 2
        assert nb['cells'][0]['metadata']['step'] == 'connect'
        assert nb['cells'][1]['metadata']['step'] == 'connect'

        print("✓ Duplicate step names test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_no_steps_file():
    """Test file with no STEP markers (only preamble)."""
    print("\nTesting file with no steps...")

    test_content = """# EXAMPLE: no_steps
import redis
r = redis.Redis()
r.set('key', 'value')
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.py', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Should create single preamble cell
        assert len(nb['cells']) == 1
        assert 'step' not in nb['cells'][0]['metadata']
        assert 'import redis' in ''.join(nb['cells'][0]['source'])

        print("✓ No steps file test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_nested_markers():
    """Test detection of nested markers."""
    print("\nTesting nested markers...")

    test_content = """# EXAMPLE: nested
# REMOVE_START
# REMOVE_START
# This should trigger a warning
# REMOVE_END
# REMOVE_END
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.py', '.ipynb')
        # Should complete but log warnings
        jupyterize(test_file, output_file, verbose=False)

        # File should still be created
        assert os.path.exists(output_file)

        print("✓ Nested markers test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_error_handling():
    """Test error handling for invalid inputs."""
    print("\nTesting error handling...")

    # Test non-existent file
    try:
        jupyterize('nonexistent.py', verbose=False)
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        pass

    # Test unsupported extension
    try:
        jupyterize('test.txt', verbose=False)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unsupported file extension" in str(e)

    # Test missing EXAMPLE marker
    test_content = """import redis
r = redis.Redis()
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        try:
            jupyterize(test_file, verbose=False)
            assert False, "Should have raised ValueError for missing EXAMPLE marker"
        except ValueError as e:
            assert "EXAMPLE" in str(e)
    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)

    print("✓ Error handling tests passed")


def test_csharp_boilerplate_injection():
    """Test that C# files get NuGet directives as first cell."""
    print("\nTesting C# boilerplate injection...")

    test_content = """// EXAMPLE: test_csharp
using NRedisStack;

public class TestExample {
    public void Run() {
        var muxer = ConnectionMultiplexer.Connect("localhost");
    }
}
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.cs', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.cs', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Should have at least one cell
        assert len(nb['cells']) >= 1, "Should have at least one cell"

        # First cell should be boilerplate
        first_cell = nb['cells'][0]
        first_cell_source = ''.join(first_cell['source'])
        assert '#r "nuget:' in first_cell_source, \
            f"First cell should contain NuGet directive, got: {first_cell_source}"
        assert first_cell['metadata'].get('cell_type') == 'boilerplate', \
            "First cell should be marked as boilerplate"

        print("✓ C# boilerplate injection test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_csharp_unwrapping():
    """Test that C# class/method wrappers are removed."""
    print("\nTesting C# unwrapping...")

    test_content = """// EXAMPLE: test_unwrap
using NRedisStack;

public class TestExample {
    public void Run() {
        var muxer = ConnectionMultiplexer.Connect("localhost");
        var db = muxer.GetDatabase();
    }
}
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.cs', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.cs', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Collect all code from all cells
        all_code = '\n'.join([
            ''.join(cell['source'])
            for cell in nb['cells']
        ])

        # Should NOT contain class/method declarations
        assert 'public class TestExample' not in all_code, \
            "Should not contain class declaration"
        assert 'public void Run()' not in all_code, \
            "Should not contain method declaration"

        # Should contain the actual code
        assert 'var muxer = ConnectionMultiplexer.Connect' in all_code, \
            "Should contain actual code"
        assert 'var db = muxer.GetDatabase()' in all_code, \
            "Should contain actual code"

        print("✓ C# unwrapping test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_python_no_boilerplate():
    """Test that Python files don't get boilerplate (not configured)."""
    print("\nTesting Python (no boilerplate)...")

    test_content = """# EXAMPLE: test_python
import redis

r = redis.Redis()
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.py', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Should have exactly one cell (no boilerplate)
        assert len(nb['cells']) == 1, \
            f"Python should have 1 cell (no boilerplate), got {len(nb['cells'])}"

        # First cell should NOT be boilerplate
        first_cell = nb['cells'][0]
        assert first_cell['metadata'].get('cell_type') != 'boilerplate', \
            "Python should not have boilerplate cell"

        print("✓ Python (no boilerplate) test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def main():
    """Run all tests."""
    print("=" * 60)
    print("Running jupyterize tests")
    print("=" * 60)

    try:
        # Core functionality tests
        test_language_detection()
        test_basic_conversion()
        test_hide_remove_blocks()
        test_javascript_file()

        # Edge case tests
        test_marker_format_variations()
        test_duplicate_step_names()
        test_no_steps_file()
        test_nested_markers()

        # Error handling tests
        test_error_handling()

        # Language-specific feature tests (C#)
        test_csharp_boilerplate_injection()
        test_csharp_unwrapping()
        test_python_no_boilerplate()

        # Language-specific feature tests (Java)
        test_java_unwrapping()
        test_java_static_main_unwrapping()
        test_java_real_file()

        print("\n" + "=" * 60)
        print("All tests passed! ✓")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def test_java_unwrapping():
    """Test that Java class/method wrappers and @Test annotations are removed."""
    print("\nTesting Java unwrapping...")

    test_content = """// EXAMPLE: test_java_unwrap
import redis.clients.jedis.UnifiedJedis;

public class TestExample {

    @Test
    public void run() {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
        jedis.set("key", "value");
        jedis.close();
    }
}
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.java', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.java', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Collect all code from all cells
        all_code = '\n'.join([
            ''.join(cell['source'])
            for cell in nb['cells']
        ])

        # Should NOT contain class/method declarations or @Test
        assert 'public class TestExample' not in all_code, \
            "Should not contain class declaration"
        assert '@Test' not in all_code, \
            "Should not contain @Test annotation"
        assert 'public void run()' not in all_code, \
            "Should not contain method declaration"

        # Should contain the actual code
        assert 'UnifiedJedis jedis = new UnifiedJedis' in all_code, \
            "Should contain actual code"
        assert 'jedis.set("key", "value")' in all_code, \
            "Should contain actual code"
        assert 'jedis.close()' in all_code, \
            "Should contain actual code"

        print("✓ Java unwrapping test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_java_static_main_unwrapping():
    """Test that Java static main() method wrappers are removed."""
    print("\nTesting Java static main() unwrapping...")

    test_content = """// EXAMPLE: test_java_main
import redis.clients.jedis.UnifiedJedis;

public class MainExample {
    public static void main(String[] args) {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
        jedis.ping();
    }
}
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.java', delete=False) as f:
        f.write(test_content)
        test_file = f.name

    try:
        output_file = test_file.replace('.java', '.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Collect all code from all cells
        all_code = '\n'.join([
            ''.join(cell['source'])
            for cell in nb['cells']
        ])

        # Should NOT contain class/method declarations
        assert 'public class MainExample' not in all_code, \
            "Should not contain class declaration"
        assert 'public static void main' not in all_code, \
            "Should not contain main method declaration"

        # Should contain the actual code
        assert 'UnifiedJedis jedis = new UnifiedJedis' in all_code, \
            "Should contain actual code"
        assert 'jedis.ping()' in all_code, \
            "Should contain actual code"

        print("✓ Java static main() unwrapping test passed")

    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)
        if os.path.exists(output_file):
            os.unlink(output_file)


def test_java_real_file():
    """Test with a real Java file from the repository."""
    print("\nTesting with real Java file (LandingExample.java)...")

    # Try both relative paths (from build/jupyterize and from repo root)
    test_file_options = [
        'local_examples/client-specific/jedis/LandingExample.java',
        '../../local_examples/client-specific/jedis/LandingExample.java'
    ]

    test_file = None
    for option in test_file_options:
        if os.path.exists(option):
            test_file = option
            break

    if not test_file:
        print("⚠ Skipping test - file not found in any of:", test_file_options)
        return

    try:
        output_file = tempfile.mktemp(suffix='.ipynb')
        jupyterize(test_file, output_file, verbose=False)

        with open(output_file) as f:
            nb = json.load(f)

        # Collect all code from all cells
        all_code = '\n'.join([
            ''.join(cell['source'])
            for cell in nb['cells']
        ])

        # Should NOT contain wrappers
        assert 'public class LandingExample' not in all_code, \
            "Should not contain class declaration"
        assert '@Test' not in all_code, \
            "Should not contain @Test annotation"
        assert 'public void run()' not in all_code, \
            "Should not contain method declaration"

        # Should contain actual code
        assert 'UnifiedJedis jedis' in all_code, \
            "Should contain actual code"
        assert 'jedis.set(' in all_code, \
            "Should contain actual code"

        # Should have multiple cells (one per step)
        assert len(nb['cells']) >= 4, \
            f"Should have at least 4 cells, got {len(nb['cells'])}"

        print("✓ Real Java file test passed")

    finally:
        if os.path.exists(output_file):
            os.unlink(output_file)


if __name__ == '__main__':
    sys.exit(main())


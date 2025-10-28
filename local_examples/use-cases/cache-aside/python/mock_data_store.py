"""Mock data store for simulating slow data sources."""

import time
from typing import Any, Optional


class MockDataStore:
    """Simulates a slow data source with configurable latency."""
    
    def __init__(self, latency_ms: int = 100):
        """Initialize mock data store.
        
        Args:
            latency_ms: Simulated latency in milliseconds
        """
        self.latency_ms = latency_ms
        self.data = {
            'user:1': {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'},
            'user:2': {'id': 2, 'name': 'Bob', 'email': 'bob@example.com'},
            'product:1': {'id': 1, 'name': 'Widget', 'price': 9.99},
            'product:2': {'id': 2, 'name': 'Gadget', 'price': 19.99},
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Fetch data with simulated latency.
        
        Args:
            key: Data key to fetch
            
        Returns:
            Data value or None if not found
        """
        time.sleep(self.latency_ms / 1000.0)
        return self.data.get(key)
    
    def update(self, key: str, value: Any) -> bool:
        """Update data.
        
        Args:
            key: Data key to update
            value: New value
            
        Returns:
            True if successful
        """
        time.sleep(self.latency_ms / 1000.0)
        self.data[key] = value
        return True
    
    def delete(self, key: str) -> bool:
        """Delete data.
        
        Args:
            key: Data key to delete
            
        Returns:
            True if key existed and was deleted, False otherwise
        """
        time.sleep(self.latency_ms / 1000.0)
        if key in self.data:
            del self.data[key]
            return True
        return False


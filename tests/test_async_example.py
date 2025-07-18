"""
Example tests for async functionality using pytest-asyncio.
"""

import asyncio

import pytest


class TestAsyncFunctionality:
    """Test async/await patterns."""

    @pytest.mark.asyncio
    async def test_basic_async(self):
        """Test basic async function."""

        async def async_add(a: int, b: int) -> int:
            await asyncio.sleep(0.1)
            return a + b

        result = await async_add(2, 3)
        assert result == 5

    @pytest.mark.asyncio
    async def test_async_with_timeout(self):
        """Test async function with timeout."""

        async def slow_operation():
            await asyncio.sleep(0.1)
            return "completed"

        result = await asyncio.wait_for(slow_operation(), timeout=1.0)
        assert result == "completed"

    @pytest.mark.asyncio
    async def test_concurrent_tasks(self):
        """Test running multiple async tasks concurrently."""

        async def fetch_data(delay: float, value: str) -> str:
            await asyncio.sleep(delay)
            return value

        # Run tasks concurrently
        results = await asyncio.gather(
            fetch_data(0.1, "first"),
            fetch_data(0.2, "second"),
            fetch_data(0.05, "third"),
        )

        assert results == ["first", "second", "third"]

    @pytest.mark.asyncio
    async def test_async_context_manager(self):
        """Test async context manager pattern."""

        class AsyncResource:
            def __init__(self):
                self.is_open = False

            async def __aenter__(self):
                self.is_open = True
                return self

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                self.is_open = False

        async with AsyncResource() as resource:
            assert resource.is_open

        assert not resource.is_open

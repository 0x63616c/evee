import socket
from unittest.mock import patch

import pytest

from tools.fetch_url import validate_url

MOCK_PUBLIC = [(None, None, None, None, ("93.184.216.34", 0))]


def _patch_resolve(ip):
    return patch("tools.fetch_url.socket.getaddrinfo", return_value=[(None, None, None, None, (ip, 0))])


@pytest.mark.parametrize("url", ["https://example.com", "http://example.com"])
def test_allows_valid_schemes(url):
    with patch("tools.fetch_url.socket.getaddrinfo", return_value=MOCK_PUBLIC):
        assert validate_url(url) is None


@pytest.mark.parametrize(
    "url,expected",
    [
        ("file:///etc/passwd", "only http/https URLs are supported"),
        ("ftp://example.com", "only http/https URLs are supported"),
        ("not-a-url", "only http/https URLs are supported"),
        ("http://", "invalid URL"),
    ],
)
def test_blocks_bad_schemes(url, expected):
    assert validate_url(url) == expected


@pytest.mark.parametrize(
    "ip,url",
    [
        ("127.0.0.1", "http://localhost"),
        ("10.0.0.1", "http://10.0.0.1"),
        ("192.168.1.1", "http://192.168.1.1"),
        ("169.254.169.254", "http://169.254.169.254/latest/meta-data/"),
    ],
)
def test_blocks_internal_urls(ip, url):
    with _patch_resolve(ip):
        assert validate_url(url) == "cannot fetch internal/private URLs"


def test_unresolvable_hostname():
    with patch("tools.fetch_url.socket.getaddrinfo", side_effect=socket.gaierror("fail")):
        assert validate_url("http://nxdomain.invalid") == "could not resolve hostname"
